import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import path from 'path'
import parseVideos from '../../api/parse-videos'
import { getPlaylist, getVideo } from '../../api/fetch-youtube'
import { getErrorStatusAndMessage } from '../../api/youtube'
import importEnv from '../../api/import'
import {
  Artist,
  PreloadedData,
  ResponseError,
  ResponseSuccess,
} from '../../types'

// Keeping the server side API_KEY around for awhile
// in case oauth on the client isn't ideal with 1hr tokens
const { API_KEY, LAMBDA_TASK_ROOT } = process.env
const ROOT = LAMBDA_TASK_ROOT
  ? path.join(LAMBDA_TASK_ROOT, 'src', 'functions', 'videos')
  : __dirname

const getVideos = async (id: string, accessToken?: string) => {
  const token = accessToken ? { accessToken } : { key: API_KEY }
  // For a single id, attempt to get the playlist by that id first
  // and if that fails with a non-404 error, then try getting the video
  return getPlaylist(id, token).catch((err) => {
    if (getErrorStatusAndMessage(err).status === 404) {
      return getVideo(id, token)
    }
    throw err
  })
}

const res = (
  body: ResponseError | ResponseSuccess,
  statusCode = 200
): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(body),
})

export const handler = async (
  event: Partial<APIGatewayEvent>
): Promise<APIGatewayProxyResult> => {
  const { queryStringParameters, httpMethod = '' } = event

  if (httpMethod !== 'GET') {
    return res({ error: `${httpMethod} not supported` }, 405)
  }

  if (queryStringParameters == null) {
    return res({ error: 'Missing one or more query string parameters' }, 400)
  }

  if (!queryStringParameters.id) {
    return res({ error: 'Missing required id parameter' }, 400)
  }

  const { id, accessToken } = queryStringParameters

  const log = (...parts: unknown[]) =>
    process.env.NODE_ENV !== 'test' && console.log(id, '-', ...parts)

  try {
    const [{ meta, videos }, artist] = await Promise.all([
      importEnv<PreloadedData>(path.join(ROOT, `${id}.json`)),
      importEnv<Artist>(path.join(ROOT, id)),
    ])

    console.log(meta)

    log('Found preloaded')

    return res({
      meta: {
        ...meta,
        ...artist.meta,
      },
      data: parseVideos(videos, artist),
    })
  } catch (e) {
    log(e)
    // Most playlists wont be preloaded so move on to fetching from youtube
  }

  if (!accessToken && !API_KEY) {
    return res({ error: 'Missing required accessToken parameter' }, 400)
  }

  try {
    const { videos, meta } = await getVideos(id, accessToken)

    log('Found YT API')

    return res({
      meta,
      data: parseVideos(videos),
    })
  } catch (err) {
    log(err)
    const {
      message = 'An unknown error occurred',
      status = 500,
    } = getErrorStatusAndMessage(err)
    return res({ error: message }, status)
  }
}

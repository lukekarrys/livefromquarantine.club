import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import path from 'path'
import ms from 'ms'
import parseVideos from '../../api/parse-videos'
import { getPlaylist, getVideo } from '../../api/fetch-youtube'
import { getErrorStatusAndMessage } from '../../api/youtube'
import importEnv from '../../api/import'
import * as db from '../../api/db'
import {
  Artist,
  PreloadedData,
  ResponseError,
  ResponseSuccess,
} from '../../types'

// Keeping the server side YOUTUBE_KEY around for awhile
// in case oauth on the client isn't ideal with 1hr tokens
const { YOUTUBE_KEY, LAMBDA_TASK_ROOT } = process.env
const ROOT = LAMBDA_TASK_ROOT
  ? path.join(LAMBDA_TASK_ROOT, 'src', 'server', 'functions', 'videos')
  : __dirname

const getVideos = async (id: string, accessToken?: string) => {
  const token = accessToken ? { accessToken } : { key: YOUTUBE_KEY }
  // For a single id, attempt to get the playlist by that id first
  // and if that fails with a non-404 error, then try getting the video
  return getPlaylist(id, token, { maxVideos: 50, maxComments: 50 }).catch(
    (err) => {
      if (getErrorStatusAndMessage(err).status === 404) {
        return getVideo(id, token, { maxComments: 50 })
      }
      throw err
    }
  )
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
    (process.env.NODE_ENV !== 'test' || process.env.CI) &&
    console.log(id, '-', ...parts)

  const logErr = (message: string, err: unknown) =>
    log(message, err instanceof Error ? err.message.split('\n')[0] : err)

  if (!accessToken && !YOUTUBE_KEY) {
    return res({ error: 'Missing required accessToken parameter' }, 400)
  }

  let preloadedArtist: Artist | null = null
  try {
    preloadedArtist = await importEnv<Artist>(path.join(ROOT, id))
    log('Found preloaded parser and metadata for artist')
  } catch (err) {
    logErr('Preloaded artist could not be found', err)
  }

  try {
    let videos: PreloadedData['videos']
    let meta: PreloadedData['meta']

    try {
      const cachedMedia = await db.get(id, {
        // Preloaded artists are updated via CI so always treat those as fresh
        maxAge: preloadedArtist ? undefined : ms('1d'),
      })

      log('Found in database', {
        id: cachedMedia.id,
        lastUpdated: `${cachedMedia.lastUpdated.toJSON()} / ${
          cachedMedia.lastUpdatedPretty
        }`,
      })

      // Here is a comment to prevent prettier from collapsing this empty line
      // since I started this line with a semicolon. I probably just shouldnt do
      // that but oh well
      ;({ meta, videos } = JSON.parse(cachedMedia.json) as PreloadedData)

      return res({
        meta: {
          ...meta,
          ...preloadedArtist?.meta,
        },
        data: parseVideos(videos, preloadedArtist ?? undefined),
      })
    } catch (err) {
      logErr('Not found in database', err)
    }

    ;({ videos, meta } = await getVideos(id, accessToken))

    log('Found from YT API')

    try {
      const cached = await db.update(id, { videos, meta })
      log('Cached in database', cached.id)
    } catch (err) {
      logErr('Error caching in DB', err)
    }

    return res({
      meta,
      data: parseVideos(videos),
    })
  } catch (err) {
    logErr('YouTube API error', err)

    const {
      message = 'An unknown error occurred',
      status = 500,
    } = getErrorStatusAndMessage(err)

    return res({ error: message }, status)
  }
}

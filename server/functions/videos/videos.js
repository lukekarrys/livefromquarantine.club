const fs = require('fs').promises
const dlv = require('dlv')
const path = require('path')
const nodeEval = require('eval')
const parseVideos = require('../../api/parse-videos')
const { getPlaylist, getVideo } = require('../../api/fetch-youtube')

// Keeping the server side API_KEY around for awhile
// in case oauth on the client isn't ideal with 1hr tokens
const { API_KEY, LAMBDA_TASK_ROOT } = process.env
const ROOT = LAMBDA_TASK_ROOT
  ? path.join(LAMBDA_TASK_ROOT, 'src', 'functions', 'videos')
  : __dirname

const runtimeRequire = (f) =>
  fs
    .readFile(path.join(ROOT, f), 'utf-8')
    .then((str) =>
      path.extname(f) === '.json' ? JSON.parse(str) : nodeEval(str, true)
    )

const getVideos = async (id, accessToken) => {
  let i = 0
  const reqs = [getPlaylist, getVideo]

  for (const req of reqs) {
    i++
    try {
      return await req(id, accessToken ? { accessToken } : { key: API_KEY })
    } catch (err) {
      if (!err.response || err.response.status !== 404 || i === reqs.length) {
        throw err
      }
    }
  }
}

const res = (body, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  const {
    queryStringParameters: { id, accessToken },
    httpMethod,
  } = event

  if (httpMethod !== 'GET') {
    return res({ error: `${httpMethod} not supported` }, 405)
  }

  if (!id) {
    return res({ error: 'Missing required id parameter' }, 400)
  }

  const log = (...parts) => console.log(id, '-', ...parts)

  try {
    const [{ meta, videos }, artist] = await Promise.all([
      runtimeRequire(`${id}.json`),
      runtimeRequire(`${id}.js`),
    ])

    log('Found preloaded')

    return res({
      meta: {
        ...meta,
        ...artist.meta,
      },
      data: parseVideos(videos, artist.parsers),
    })
  } catch (e) {
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
    const status = err.response ? err.response.status : 500
    const message =
      dlv(err, 'response.data.error.message') || 'An error occurred'
    return res({ error: message }, status)
  }
}

const fs = require('fs').promises
const path = require('path')
const nodeEval = require('eval')
const parseVideos = require('../../api/parse-videos')
const { getPlaylist, getVideo } = require('../../api/fetch-youtube')

const { API_KEY, LAMBDA_TASK_ROOT } = process.env
const ROOT = LAMBDA_TASK_ROOT
  ? path.join(LAMBDA_TASK_ROOT, 'src', 'functions', 'videos')
  : __dirname

const getVideos = async (id, key) => {
  const errors = []
  for (const req of [getPlaylist, getVideo]) {
    try {
      return await req(id, key)
    } catch (e) {
      errors.push(e)
    }
  }

  throw new Error(
    `fetching either playlist or video:\n${errors
      .map((e) => e.stack)
      .join('\n')}`
  )
}

const res = (body, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(body),
})

exports.handler = async (event) => {
  const {
    queryStringParameters: { id },
    httpMethod,
  } = event

  if (httpMethod !== 'GET') {
    return res({ error: `${httpMethod} not supported` }, 405)
  }

  if (!id) {
    return res({ error: 'Missing required id parameter' }, 400)
  }

  const log = (...parts) => console.log(id, ...parts)

  log('Fetching')

  try {
    const [{ meta, videos }, artist] = await Promise.all([
      fs
        .readFile(path.join(ROOT, `${id}.json`), 'utf-8')
        .then((str) => JSON.parse(str)),
      fs
        .readFile(path.join(ROOT, `${id}.js`), 'utf-8')
        .then((str) => nodeEval(str, true)),
    ])

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

  try {
    const { videos, meta } = await getVideos(id, API_KEY)

    return res({
      meta,
      data: parseVideos(videos),
    })
  } catch (err) {
    log(err)
    return res({ error: 'Error fetching videos' }, 500)
  }
}

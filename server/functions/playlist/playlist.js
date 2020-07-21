const fs = require('fs').promises
const path = require('path')
const nodeEval = require('eval')
const parseVideos = require('../../api/parse-videos')
const { getPlaylist, getVideo } = require('../../api/fetch-youtube')

const { API_KEY, LAMBDA_TASK_ROOT } = process.env
const ROOT = LAMBDA_TASK_ROOT
  ? path.join(LAMBDA_TASK_ROOT, 'src', 'functions', 'playlist')
  : __dirname

const getPlaylistOrVideo = async (id, key) => {
  let res
  let error

  try {
    res = await getPlaylist(id, key)
  } catch (err) {
    error = err
  }

  if (error) {
    try {
      error = null
      res = await getVideo(id, key)
    } catch (err) {
      error = err
    }
  }

  if (error) {
    throw error
  }

  return res
}

exports.handler = async (event) => {
  const {
    queryStringParameters: { id },
    httpMethod,
  } = event

  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: `${httpMethod} not supported` }),
    }
  }

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required id parameter' }),
    }
  }

  try {
    const [preloadedData, artist] = await Promise.all([
      fs
        .readFile(path.join(ROOT, `${id}.json`), 'utf-8')
        .then((str) => JSON.parse(str)),
      fs
        .readFile(path.join(ROOT, `${id}.js`), 'utf-8')
        .then((str) => nodeEval(str, true)),
    ])

    return {
      statusCode: 200,
      body: JSON.stringify({
        meta: {
          ...preloadedData.meta,
          ...artist.meta,
        },
        data: parseVideos(preloadedData.videos, artist.parsers),
      }),
    }
  } catch (e) {
    // Most playlists wont be preloaded so move on to fetching from youtube
  }

  try {
    const { videos, meta } = await getPlaylistOrVideo(id, API_KEY)

    return {
      statusCode: 200,
      body: JSON.stringify({
        meta,
        data: parseVideos(videos),
      }),
    }
  } catch (err) {
    console.error('errrrrrrr', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error fetching playlist',
      }),
    }
  }
}

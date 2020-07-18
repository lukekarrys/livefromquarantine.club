const fs = require('fs').promises
const path = require('path')
const nodeEval = require('eval')
const parsePlaylist = require('../../api/parse-playlist')
const fetchPlaylist = require('../../api/fetch-playlist')

const { API_KEY, LAMBDA_TASK_ROOT } = process.env
const resolveSrcFile = (...parts) =>
  LAMBDA_TASK_ROOT
    ? path.join(LAMBDA_TASK_ROOT, 'src', ...parts)
    : path.join(__dirname, ...parts)

exports.handler = async (event) => {
  const { queryStringParameters, httpMethod } = event

  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: `${httpMethod} not supported` }),
    }
  }

  const { id } = queryStringParameters

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required id parameter' }),
    }
  }

  try {
    const dir = await fs.readdir(LAMBDA_TASK_ROOT)
    const dir2 = await fs.readdir(resolveSrcFile())

    console.log(dir)
    console.log(dir2)

    const [preloadedData, artist] = await Promise.all([
      fs
        .readFile(resolveSrcFile(`${id}.json`), 'utf-8')
        .then((str) => JSON.parse(str)),
      fs
        .readFile(resolveSrcFile(`${id}.js`), 'utf-8')
        .then((str) => nodeEval(str, true)),
    ])

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({
        meta: {
          ...preloadedData.meta,
          ...artist.meta,
        },
        data: parsePlaylist(preloadedData.videos, artist.parsers),
      }),
    }
  } catch (e) {
    // Most playlists wont be preloaded so move on to fetching from youtube
  }

  try {
    const { videos, meta } = await fetchPlaylist(
      queryStringParameters.id,
      API_KEY
    )

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({
        meta,
        data: parsePlaylist(videos),
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error fetching playlist',
      }),
    }
  }
}

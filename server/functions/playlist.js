const { processData } = require('../api/build')
const { fetchPlaylist } = require('../data/index')

const { API_KEY } = process.env

exports.handler = async (event) => {
  const { queryStringParameters, httpMethod } = event

  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: `${httpMethod} not supported` }),
    }
  }

  try {
    const { videos, meta } = await fetchPlaylist(
      queryStringParameters.id,
      API_KEY
    )

    const data = processData(meta, videos)

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: err,
    }
  }
}

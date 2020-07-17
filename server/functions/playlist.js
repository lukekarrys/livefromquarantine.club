const { parseData } = require('../api/parse')
const fetchPlaylist = require('../data/fetch')

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

    return {
      statusCode: 200,
      body: JSON.stringify({
        meta,
        data: parseData(videos),
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: err,
    }
  }
}

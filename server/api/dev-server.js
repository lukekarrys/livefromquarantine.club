const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const http = require('http')
const functionHandler = require('../functions/videos/videos').handler

const port = 3001
const server = http.createServer()

server
  .on('request', async (req, res) => {
    try {
      const reqUrl = new URL(req.url, 'http://localhost:3000')
      const { body, statusCode } = await functionHandler({
        queryStringParameters: {
          id: reqUrl.searchParams.get('id'),
          accessToken: reqUrl.searchParams.get('accessToken'),
        },
        httpMethod: req.method,
      })
      res.writeHead(statusCode)
      res.end(body)
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
  })
  .listen(port)

console.log(`Listening on ${port}`)

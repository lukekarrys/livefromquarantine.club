const http = require('http')
const path = require('path')
const buildArtist = require('./build')

const port = 8081

http
  .createServer((req, res) => {
    try {
      const data = buildArtist(path.basename(req.url, '.json'))
      res.writeHead(200)
      res.end(JSON.stringify(data))
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
  })
  .listen(port)

console.log(`Listening on ${port}`)

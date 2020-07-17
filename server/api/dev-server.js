const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const http = require('http')
const parsePreload = require('./parse-preload')
const fetchPlaylist = require('../functions/playlist').handler
const { artists } = require('../artists')

const port = 3001
const server = http.createServer()

const CACHE = new Map()

server
  .on('request', async (req, res) => {
    try {
      if (req.method !== 'GET') throw new Error('Unsupported method')

      const id = path.basename(req.url, '.json')
      if (!id) throw new Error('Missing ID')

      let data
      if (artists.includes(id)) {
        data = parsePreload(path.basename(req.url, '.json'))
      } else if (CACHE.has(id)) {
        data = CACHE.get(id)
      } else {
        const resp = await fetchPlaylist({
          queryStringParameters: { id },
          httpMethod: req.method,
        })
        if (resp.statusCode !== 200) {
          res.writeHead(resp.statusCode)
          res.end(resp.body)
          return
        }
        data = JSON.parse(resp.body)
        CACHE.set(id, data)
      }

      res.writeHead(200)
      res.end(JSON.stringify(data))
    } catch (e) {
      res.writeHead(500)
      res.end(JSON.stringify({ error: e.message }))
    }
  })
  .listen(port)

console.log(`Listening on ${port}`)

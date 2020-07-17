const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const http = require('http')
const buildArtist = require('./parse-preloaded')
const fetchPlaylist = require('../functions/playlist').handler
const config = require('../../config')

const validIds = config.artists.map((a) => a.id)

const port = 3001

const server = http.createServer()

server
  .on('request', async (req, res) => {
    try {
      if (req.method !== 'GET') throw new Error('Unsupported method')

      const id = path.basename(req.url, '.json')
      if (!id) throw new Error('Missing ID')

      let data
      if (validIds.includes(id)) {
        data = buildArtist(path.basename(req.url, '.json'))
      } else {
        const resp = await fetchPlaylist({
          queryStringParameters: { id },
          httpMethod: req.method,
        })
        if (resp.statusCode !== 200) {
          throw new Error(resp.body)
        }
        data = JSON.parse(resp.body)
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

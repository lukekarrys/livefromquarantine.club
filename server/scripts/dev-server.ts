import '../api/dotenv'
import http from 'http'
import { URLSearchParams } from 'url'
import { handler as getVideos } from '../functions/videos/videos'

const port = 3001

http
  .createServer((req, res) => {
    const params = new URLSearchParams(req.url?.split('?')[1])

    getVideos({
      queryStringParameters: {
        id: params.get('id') ?? undefined,
        accessToken: params.get('accessToken') ?? undefined,
      },
      httpMethod: req.method,
    })
      .then(({ body, statusCode }) => {
        res.writeHead(statusCode)
        res.end(body)
      })
      .catch((error: Error) => {
        res.writeHead(500)
        res.end(
          JSON.stringify({
            error: error.message,
          })
        )
      })
  })
  .listen(port, () => console.log(`Listening on http://localhost:${port}`))

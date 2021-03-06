import 'dotenv'
import http, { IncomingMessage, ServerResponse } from 'http'
import ms from 'mediaserver'
import path from 'path'
import { handler as getVideos } from '../functions/videos/videos'

const port = 3001

const fns: {
  [key: string]: (
    req: IncomingMessage,
    res: ServerResponse,
    params: URLSearchParams
  ) => Promise<void>
} = {
  '/videos': async (req, res, params) => {
    const { body, statusCode } = await getVideos({
      queryStringParameters: {
        id: params.get('id') ?? undefined,
        accessToken: params.get('accessToken') ?? undefined,
      },
      httpMethod: req.method,
    })
    res.writeHead(statusCode)
    res.end(body)
  },
  '/mp3': async (req, res, params) => {
    const id = params.get('id')

    if (!id) {
      throw new Error()
    }

    await ms.pipe(
      req,
      res,
      path.resolve(__dirname, '..', '..', '.mp3', `${id}.mp3`)
    )
  },
}

http
  .createServer((req, res) => {
    const [url, search] = (req.url || '').split('?')
    const params = new URLSearchParams(search)

    fns[url](req, res, params).catch((e) => {
      res.writeHead(500)
      res.end(
        JSON.stringify({
          error: e instanceof Error ? e.message : 'An unknown error occurred',
        })
      )
    })
  })
  .listen(port, () => console.log(`Listening on ${port}`))

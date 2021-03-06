declare module 'mediaserver' {
  import { IncomingMessage, ServerResponse } from 'http'

  namespace mediaserver {
    function pipe(
      req: IncomingMessage,
      res: ServerResponse,
      filePath: string
    ): unknown
  }

  export = mediaserver
}

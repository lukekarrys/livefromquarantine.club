import { AxiosError } from 'axios'

declare class ErrorClass implements Error {
  public name: string
  public publicMessage: string
  public status: number
  message: string
  stack?: string | undefined
  constructor(message?: string)
}

export default class YouTubeError extends ErrorClass {
  public name = 'YouTubeError'
  constructor(publicMessage: string, status: number, privateMessage?: string) {
    super(privateMessage || publicMessage)
    this.status = status
    this.publicMessage = publicMessage
  }
}

const isAxiosError = (err: unknown): err is AxiosError =>
  (err as AxiosError).isAxiosError ?? false

export const getErrorStatusAndMessage = (
  err: unknown
): { status?: number; message?: string } => {
  if (err instanceof YouTubeError) {
    // These are errors thrown manually from youtube that we want to raise
    // like responses with empty arrays when we need at least one
    return {
      status: err.status,
      message: err.publicMessage,
    }
  }

  if (isAxiosError(err)) {
    return {
      status: err.response?.status,
      // This is the shape of an error from the YouTube api. Maybe I'll got back and figure out to type it
      // but for now this is the last TS error and I just want to do this
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      message: err.response?.data?.error?.message,
    }
  }

  return {}
}

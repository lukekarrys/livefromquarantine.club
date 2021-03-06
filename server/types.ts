export interface Artist {
  parsers?: {
    [key: string]: ((str: string) => string) | undefined
  }
  omitVideoIds?: string[]
  omitCommentIds?: string[]
  pickCommentIds?: string[]
  playlistId: string
  id: string
  meta: {
    title: string
    description?: string
  }
  comments?: {
    [key: string]: string[]
  }
}

export type Token = { key?: string; accessToken?: string }

export type VideoWithComments = YouTube.Video & {
  comments: YouTube.CommentThread[]
}

export type PreloadedData = {
  meta: {
    title: string
    description?: string
  }
  videos: VideoWithComments[]
}

export type ParsedSong = {
  name: string
  start: number
}

export type ParsedVideo = {
  title: string
  id: string
  duration: number
  songs: ParsedSong[]
}

export type ResponseSuccess = {
  meta: {
    title: string
    description?: string
  }
  data: ParsedVideo[]
}

export type ResponseError = { error: string }

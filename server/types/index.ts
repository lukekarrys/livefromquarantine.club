import * as YouTube from './youtube'

export { YouTube }

type Meta = {
  title: string
  description?: string
}

export interface Artist {
  id: string
  playlistId: string
  meta: Meta
  titleParser?: (str: string) => string
  videoParsers?: {
    [key: string]:
      | {
          title?: (title: string) => string
          comments?: string
        }
      | undefined
  }
  sortVideos?: (videoA: VideoWithComments, videoB: VideoWithComments) => number
  commentParsers?: {
    [key: string]: ((comment: string) => string) | undefined
  }
  omitVideoIds?: string[]
  omitCommentIds?: string[]
}

export type Token = { key?: string; accessToken?: string }

export type VideoWithComments = Omit<
  Pick<YouTube.Video, 'id'>,
  'snippet' | 'contentDetails'
> & {
  contentDetails: {
    duration: number
  }
  snippet: Pick<
    YouTube.VideoSnippet,
    'title' | 'description' | 'publishedAt' | 'thumbnails'
  >
  comments: (Omit<Pick<YouTube.CommentThread, 'id'>, 'snippet'> & {
    snippet: Omit<
      Pick<YouTube.CommentThreadSnippet, 'videoId'>,
      'topLevelComment'
    > & {
      topLevelComment: {
        snippet: Pick<YouTube.CommentSnippet, 'publishedAt' | 'textDisplay'>
      }
    }
  })[]
}

export type PreloadedData = {
  meta: Meta
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
  meta: Meta
  data: ParsedVideo[]
}

export type ResponseError = { error: string }

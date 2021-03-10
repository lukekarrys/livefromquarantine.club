import axios, { AxiosError } from 'axios'
import { Token, YouTube, VideoWithComments } from '../types'
import duration from 'iso8601-duration'

export const normalizeVideo = (
  video: YouTube.Video & {
    comments: YouTube.CommentThread[]
  }
): VideoWithComments => {
  return {
    contentDetails: {
      duration: duration.toSeconds(
        duration.parse(video.contentDetails.duration)
      ),
    },
    id: video.id,
    snippet: {
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails,
    },
    comments: video.comments.map((comment) => ({
      id: comment.id,
      snippet: {
        videoId: comment.snippet.videoId,
        topLevelComment: {
          snippet: {
            textDisplay: comment.snippet.topLevelComment.snippet.textDisplay,
            publishedAt: new Date(
              comment.snippet.topLevelComment.snippet.publishedAt
            ).toJSON(),
          },
        },
      },
    })),
  }
}

const get = <T>({
  url,
  token,
  params = {},
  headers = {},
}: {
  url: string
  token: Token
  params?: Record<string, unknown>
  headers?: Record<string, unknown>
}) => {
  const axiosRequest = {
    baseURL: `https://www.googleapis.com/youtube/v3`,
    url,
    params,
    headers,
  }

  if (token.key) {
    axiosRequest.params.key = token.key
  } else if (token.accessToken) {
    axiosRequest.headers.Authorization = `Bearer ${token.accessToken}`
  }

  return axios.request<T>(axiosRequest)
}

export const commentThreads = (
  id: string,
  token: Token,
  pageToken?: string
): Promise<YouTube.CommentThreadListResponse> =>
  get<YouTube.CommentThreadListResponse>({
    url: '/commentThreads',
    params: Object.assign(
      {
        part: 'snippet',
        order: 'relevance',
        textFormat: 'plainText',
        maxResults: '100',
        videoId: id,
      },
      pageToken ? { pageToken } : {}
    ),
    token,
  }).then((r) => r.data)

export const playlistItems = (
  id: string,
  token: Token,
  pageToken?: string
): Promise<YouTube.PlaylistItemListResponse> =>
  get<YouTube.PlaylistItemListResponse>({
    url: '/playlistItems',
    params: Object.assign(
      {
        part: 'snippet',
        maxResults: '50',
        playlistId: id,
      },
      pageToken ? { pageToken } : {}
    ),
    token,
  }).then((r) => r.data)

export const playlist = (
  id: string,
  token: Token
): Promise<YouTube.PlaylistListResponse> =>
  get<YouTube.PlaylistListResponse>({
    url: '/playlists',
    params: {
      part: 'snippet',
      maxResults: '1',
      id: id,
    },
    token,
  }).then((r) => r.data)

export const video = (
  id: string,
  parts: string[],
  token: Token
): Promise<YouTube.VideoListResponse> =>
  get<YouTube.VideoListResponse>({
    url: '/videos',
    params: {
      part: parts.join(','),
      id: id,
    },
    token,
  }).then((r) => r.data)

export class YouTubeError extends Error {
  public status: number
  public publicMessage: string
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

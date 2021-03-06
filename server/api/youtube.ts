import axios from 'axios'
import { Token } from '../types'

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

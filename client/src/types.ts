export type TrackId = 'string'
export type VideoId = 'string'
export type ArtistId = 'string'
export type OrderId = 'string'
export type AccessToken = 'string'

export type Track = {
  id: TrackId
  videoId: VideoId
  title: string | string[]
  start: number
  end: number
  duration: number
  isSong: boolean
}

export type Tracks = Track[]

export type Video = {
  title: string
  id: VideoId
  duration: number
  tracks: Tracks
}

export type Videos = Video[]

export interface ArtistMeta {
  title: string
  description?: string
}

export enum Repeat {
  None,
  Video,
  Song,
}

export enum SelectMode {
  UpNext,
  Play,
}

export enum MediaMode {
  Audio,
  YouTube,
  YouTubeOnly,
  Empty,
}

export const DefaultMediaMode = MediaMode.YouTube

export type TrackId = 'string'
export type VideoId = 'string'
export type ArtistId = 'string'

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
  description: string
  main?: string
}

export type Progress = {
  time: number
  percent: number
}

export enum Repeat {
  None,
  Video,
  Song,
}

export type TrackId = "string"
export type VideoId = "string"

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

export interface Data {
  videos: Videos
  tracks: Tracks
}

export type Progress = {
  time: number
  percent: number
}

export enum Repeat {
  None,
  All,
  Video,
  Song,
}

export type ControlState = {
  progress: number
  play: boolean
  shuffle: boolean
  repeat: Repeat
  hasPrevious: boolean
  hasNext: boolean
}

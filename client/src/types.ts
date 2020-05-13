export type Track = {
  id: string
  videoId: string
  title: string | string[]
  start: number
  end: number
  duration: number
  isSong: boolean
}

export type Tracks = Track[]

export type Video = {
  title: string
  id: string
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

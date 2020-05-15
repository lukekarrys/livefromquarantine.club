import { Track } from "../types"

export const isSeekableTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track && !!nextTrack && track.videoId === nextTrack.videoId

export const isNextTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track &&
  !!nextTrack &&
  track.videoId === nextTrack.videoId &&
  track.end === nextTrack.start

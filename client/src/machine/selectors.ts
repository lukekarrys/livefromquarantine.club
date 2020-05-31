import { Track, Repeat, SelectMode, TrackId } from '../types'
import * as Machine from './types'

// Utils

const every = (
  ...selectors: ((
    context: Machine.PlayerContext,
    event: Machine.PlayerEvent
  ) => boolean)[]
) => (context: Machine.PlayerContext, event: Machine.PlayerEvent): boolean =>
  selectors.every((s) => s(context, event))

// Context and state ready states

export const isReady = (state: Machine.PlayerMachineState): boolean => {
  return (
    state.matches('ready') ||
    state.matches('requesting') ||
    state.matches('playing') ||
    state.matches('paused')
  )
}

export const hasTracks = (context: Machine.PlayerContext): boolean => {
  return !!context.tracks
}

export const isPlayerReady = (context: Machine.PlayerContext): boolean => {
  return !!context.player
}

// Get tracks

export const getTrackById = (
  context: Pick<Machine.PlayerContext, 'tracksById'>,
  trackId: TrackId
): Track | undefined => {
  return context.tracksById[trackId]
}

export const getEventTrack = (
  context: Machine.PlayerContext,
  event: Machine.SelectTrackEvent
): Track | undefined => {
  const trackIndex = context[event.order].trackIndexes[event.id]
  if (trackIndex == null) return undefined
  const trackId = context[event.order].trackOrder[trackIndex]?.trackId
  return getTrackById(context, trackId)
}

// Selected track

export const getSelected = (
  context: Machine.PlayerContext
): Track | undefined => {
  const index = context[context.currentOrder].selectedIndex
  const trackId = context[context.currentOrder].trackOrder[index]?.trackId
  return getTrackById(context, trackId)
}

export const hasSelected = (context: Machine.PlayerContext): boolean => {
  return getSelected(context) !== undefined
}

// Next track

export const getNextIndex = (
  context: Machine.PlayerContext
): {
  selectedIndex: number
  currentOrder: Machine.PlayerContext['currentOrder']
} => {
  const { selectedIndex: upNextIndex, trackOrder: upNextOrder } = context.upNext
  const nextUpNextIndex = upNextIndex + 1

  if (nextUpNextIndex < upNextOrder.length) {
    return {
      selectedIndex: nextUpNextIndex,
      currentOrder: 'upNext',
    }
  }

  const { selectedIndex, trackOrder } = context.order
  const nextIndex = selectedIndex + 1

  return {
    selectedIndex: nextIndex >= trackOrder.length ? 0 : nextIndex,
    currentOrder: 'order',
  }
}

const getNextTrack = (context: Machine.PlayerContext): Track | undefined => {
  const { selectedIndex, currentOrder } = getNextIndex(context)
  return getTrackById(
    context,
    context[currentOrder].trackOrder[selectedIndex]?.trackId
  )
}

// Track Seeking

const isSeekableTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track && !!nextTrack && track.videoId === nextTrack.videoId

const isNextTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track &&
  !!nextTrack &&
  track.videoId === nextTrack.videoId &&
  track.end === nextTrack.start

export const isNextSeekable = (context: Machine.PlayerContext): boolean => {
  const current = getSelected(context)
  const next = getNextTrack(context)
  return isSeekableTrack(current, next)
}

export const isEventSeekable = (
  context: Machine.PlayerContext,
  event: Machine.SelectTrackEvent
): boolean => {
  return isSeekableTrack(getSelected(context), getEventTrack(context, event))
}

export const isNextNext = (context: Machine.PlayerContext): boolean => {
  const current = getSelected(context)
  const next = getNextTrack(context)
  return isNextTrack(current, next)
}

// Player modes

export const isSongMode = (
  context: Pick<Machine.PlayerContext, 'tracksById'>,
  trackId?: TrackId
): boolean => {
  return trackId == null ? true : getTrackById(context, trackId)?.isSong ?? true
}

export const isOrderChange = (
  context: Machine.PlayerContext,
  event: Machine.SelectTrackEvent
): boolean => {
  const track = getEventTrack(context, event)
  if (!track) return false
  return track.isSong !== isSongMode(context, getSelected(context)?.id)
}

export const getNextShuffle = (context: Machine.PlayerContext): boolean => {
  return !context.shuffle
}

export const getNextRepeat = (context: Machine.PlayerContext): Repeat => {
  switch (context.repeat) {
    case Repeat.None:
      return Repeat.Song
    case Repeat.Song:
      return Repeat.Video
    case Repeat.Video:
      return Repeat.None
  }
}

export const upNextMode = (context: Machine.PlayerContext): boolean => {
  return context.selectMode === SelectMode.UpNext
}

export const eventIsUpNext = every(
  upNextMode,
  hasSelected,
  (_, event) => !(event as Machine.SelectTrackEvent).forcePlay
)

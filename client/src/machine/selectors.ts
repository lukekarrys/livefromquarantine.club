import { Track, Repeat } from '../types'
import * as Machine from './types'

const isSeekableTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track && !!nextTrack && track.videoId === nextTrack.videoId

const isNextTrack = (track?: Track, nextTrack?: Track): boolean =>
  !!track &&
  !!nextTrack &&
  track.videoId === nextTrack.videoId &&
  track.end === nextTrack.start

export const defaultSongMode = true

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

export const getSelectedByIndex = (
  context: Machine.PlayerContext,
  index?: number
): Track | undefined => {
  return index === undefined ||
    context.tracksById === undefined ||
    context.order.trackOrder === undefined
    ? undefined
    : context.tracksById[context.order.trackOrder[index]]
}

export const getSelected = (
  context: Machine.PlayerContext
): Track | undefined => {
  return getSelectedByIndex(context, context.order.selectedIndex)
}

export const getCurrentSongMode = (context: Machine.PlayerContext): boolean => {
  return getSelected(context)?.isSong ?? defaultSongMode
}

export const getNextIndex = (
  context: Machine.PlayerContext
): number | undefined => {
  const repeat = context.repeat
  const selectedIndex = context.order.selectedIndex
  const trackOrder = context.order.trackOrder

  if (selectedIndex == null || trackOrder == null) return undefined

  if (repeat === Repeat.Song) {
    return selectedIndex
  }

  const nextIndex = selectedIndex + 1
  return nextIndex >= trackOrder.length ? 0 : nextIndex
}

export const getNextSelected = (
  context: Machine.PlayerContext
): Track | undefined => {
  return getSelectedByIndex(context, getNextIndex(context))
}

export const getEventTrack = (
  context: Machine.PlayerContext,
  event: Machine.SelectTrackEvent | Machine.FetchSuccessEvent
): Track | undefined => {
  return event.trackId && context.tracksById[event.trackId]
}

export const hasSelected = (context: Machine.PlayerContext): boolean => {
  return getSelected(context) !== undefined
}

export const isNextSeekable = (context: Machine.PlayerContext): boolean => {
  const current = getSelected(context)
  const next = getNextSelected(context)
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
  const next = getNextSelected(context)
  return isNextTrack(current, next)
}

export const isPlayerReady = (context: Machine.PlayerContext): boolean => {
  return !!context.player
}

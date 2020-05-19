import { Tracks, Track, Repeat, VideoId } from '../types'
import * as Machine from './types'

const shuffleOrder = (
  order: Machine.TrackOrderUnselected
): Machine.TrackOrderUnselected => {
  const newOrder = ([] as Machine.TrackOrderUnselected['trackOrder']).concat(
    order.trackOrder
  )
  const newIndexes = {} as Machine.TrackOrderUnselected['trackIndexes']

  let currentIndex = newOrder.length

  while (0 !== currentIndex) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    const val1 = newOrder[currentIndex]
    const val2 = newOrder[randomIndex]

    newOrder[currentIndex] = val2
    newIndexes[val2] = currentIndex

    newOrder[randomIndex] = val1
    newIndexes[val1] = randomIndex
  }

  return {
    trackOrder: newOrder,
    trackIndexes: newIndexes,
  }
}

const emptyTrackOrder = (): Machine.TrackOrderUnselected => ({
  trackOrder: [],
  trackIndexes: {},
})

const setOrderAndIndex = (
  order: Machine.TrackOrderUnselected,
  track: Track
): number => {
  const position = order.trackOrder.push(track.id)
  order.trackIndexes[track.id] = position - 1
  return position
}

const findIndexInOrder = (
  order: Machine.TrackOrderUnselected,
  track?: Track
): number => {
  return (track?.id && order.trackIndexes[track.id]) ?? -1
}

export const current = ({
  shuffle,
  repeat,
  selected,
  songOrder,
  videoOrder,
  videoSongOrder,
}: Pick<
  Machine.PlayerContext,
  'songOrder' | 'videoOrder' | 'videoSongOrder' | 'shuffle' | 'repeat'
> & { selected?: Track }): Machine.TrackOrder => {
  let currentOrder: Machine.TrackOrder = {} as Machine.TrackOrder

  // The current song mode is set by the selected song but the default
  // is song mode
  const songMode = selected?.isSong ?? true

  if (repeat === Repeat.None) {
    // No repeat, so the order is either the full song order
    // or video order depending on the current mode
    const order = songMode ? songOrder : videoOrder
    currentOrder = {
      ...order,
      selectedIndex: findIndexInOrder(order, selected),
    }
  } else if (repeat === Repeat.Song || (repeat === Repeat.Video && !songMode)) {
    // We are repeating a single song or repeating a video but the current mode
    // is video mode, so that's the same thing as repeating a single song

    // The current track id is the selected one, or the first song or video
    // depending on the mode
    const trackId =
      selected?.id ??
      (songMode ? songOrder.trackOrder[0] : videoOrder.trackOrder[0])

    // We can build a simple order here since there is only one song
    // but we still have to check if the selected is available since
    // if nothing is selected we want to keep the order but not select anything
    currentOrder = {
      trackIndexes: { [trackId]: 0 },
      trackOrder: [trackId],
      selectedIndex: selected ? 0 : -1,
    }
  } else if (repeat === Repeat.Video) {
    // We are repeating an entire video, and song mode is always true here since we
    // check the inverse in the above conditional

    // The video comes from the selected track or the first video
    const videoId = selected?.videoId ?? videoOrder.trackOrder[0]
    // and the songs come from videoSongOrder which we calculated
    // when the tracks were initiall set
    const order = videoSongOrder[videoId] as Machine.TrackOrderUnselected

    currentOrder = {
      ...order,
      selectedIndex: findIndexInOrder(order, selected),
    }
  }

  if (shuffle) {
    // Shuffle the order and indexes to match
    const order = shuffleOrder({
      trackOrder: currentOrder.trackOrder,
      trackIndexes: currentOrder.trackIndexes,
    })
    // If there is a currently selected song keep it at the beginning
    if (selected) {
      order.trackIndexes[selected.id] = 0
      order.trackOrder.unshift(selected.id)
    }
    currentOrder = {
      ...order,
      selectedIndex: findIndexInOrder(order, selected),
    }
  }

  return currentOrder
}

export const initial = (
  tracks: Tracks,
  {
    selected,
    shuffle,
    repeat,
  }: { selected?: Track; shuffle: boolean; repeat: Repeat }
): Pick<
  Machine.PlayerContext,
  | 'tracks'
  | 'tracksById'
  | 'songOrder'
  | 'videoOrder'
  | 'order'
  | 'videoSongOrder'
> => {
  const tracksById = {} as Machine.PlayerContext['tracksById']
  const songOrder = emptyTrackOrder()
  const videoOrder = emptyTrackOrder()
  const videoSongOrder: {
    [key in VideoId]?: Machine.TrackOrderUnselected
  } = {}

  for (let i = 0, m = tracks.length; i < m; i++) {
    const track = tracks[i]
    tracksById[track.id] = track

    if (track.isSong) {
      setOrderAndIndex(songOrder, track)
      setOrderAndIndex(
        videoSongOrder[track.videoId] ??
          (videoSongOrder[track.videoId] = emptyTrackOrder()),
        track
      )
    } else {
      setOrderAndIndex(videoOrder, track)
    }
  }

  return {
    tracks,
    tracksById,
    songOrder,
    videoOrder,
    videoSongOrder,
    order: current({
      shuffle,
      repeat,
      songOrder,
      videoOrder,
      videoSongOrder,
      selected,
    }),
  }
}

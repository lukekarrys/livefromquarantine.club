import { Tracks, Repeat, VideoId, TrackId, OrderId } from '../types'
import * as Machine from './types'
import * as selectors from './selectors'

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
    newIndexes[val2.orderId] = currentIndex

    newOrder[randomIndex] = val1
    newIndexes[val1.orderId] = randomIndex
  }

  return {
    trackOrder: newOrder,
    trackIndexes: newIndexes,
  }
}

export const emptyTrackOrder = (): Machine.TrackOrderUnselected => ({
  trackOrder: [],
  trackIndexes: {},
})

const setOrderAndIndex = (
  order: Machine.TrackOrderUnselected,
  { trackId, orderId }: { trackId: TrackId; orderId: OrderId }
): number => {
  const position = order.trackOrder.push({ trackId, orderId })
  order.trackIndexes[orderId] = position - 1
  return position
}

const findIndexInOrder = (
  order: Machine.TrackOrderUnselected,
  orderId?: OrderId
): number => {
  return (orderId && order.trackIndexes[orderId]) ?? -1
}

export const generateOrderId = (id: TrackId): OrderId =>
  `${id}-${Math.random().toString().slice(2, 6)}` as OrderId

export const addTrack = (
  order: Machine.TrackOrder,
  { trackId, orderId }: { trackId: TrackId; orderId: OrderId },
  position: number | 'end' | 'start'
): Machine.TrackOrder => {
  if (position === 'end') position = order.trackOrder.length
  else if (position === 'start') position = 0
  order.trackOrder.splice(position, 0, { trackId, orderId })
  order.trackIndexes[orderId] = position
  return order
}

export const removeTrack = (
  order: Machine.TrackOrder,
  orderId: OrderId
): Machine.TrackOrder => {
  const position = order.trackIndexes[orderId]
  if (position == null) return order
  order.trackOrder.splice(position, 1)
  delete order.trackIndexes[orderId]
  return order
}

export const setOrder = ({
  tracksById,
  shuffle,
  repeat,
  selectedId,
  songOrder,
  videoOrder,
  videoSongOrder,
}: Pick<
  Machine.PlayerContext,
  | 'songOrder'
  | 'videoOrder'
  | 'videoSongOrder'
  | 'shuffle'
  | 'repeat'
  | 'tracksById'
> & { selectedId?: TrackId }): Machine.TrackOrder => {
  let currentOrder: Machine.TrackOrderUnselected = {} as Machine.TrackOrderUnselected

  // The current song mode is set by the selected song but the default
  // is song mode
  const selected =
    selectedId && selectors.getTrackById({ tracksById }, selectedId)
  const songMode = selectors.isSongMode({ tracksById }, selectedId)

  if (repeat === Repeat.None) {
    // No repeat, so the order is either the full song order
    // or video order depending on the current mode
    currentOrder = songMode ? songOrder : videoOrder
  } else if (repeat === Repeat.Song || (repeat === Repeat.Video && !songMode)) {
    // We are repeating a single song or repeating a video but the current mode
    // is video mode, so that's the same thing as repeating a single song

    // The current track id is the selected one, or the first song or video
    // depending on the mode
    const trackId =
      selected?.id ??
      (songMode
        ? songOrder.trackOrder[0].trackId
        : videoOrder.trackOrder[0].trackId)

    // We can build a simple order here since there is only one song
    // but we still have to check if the selected is available since
    // if nothing is selected we want to keep the order but not select anything
    currentOrder = {
      trackIndexes: { [trackId]: 0 },
      trackOrder: [{ trackId, orderId: trackId }],
    }
  } else if (repeat === Repeat.Video) {
    // We are repeating an entire video, and song mode is always true here since we
    // check the inverse in the above conditional

    // The video comes from the selected track or the first video
    const videoId = selected?.videoId ?? videoOrder.trackOrder[0].trackId
    // and the songs come from videoSongOrder which we calculated
    // when the tracks were initiall set
    currentOrder = videoSongOrder[videoId] as Machine.TrackOrderUnselected
  }

  if (shuffle) {
    // Shuffle the order and indexes to match
    const order = shuffleOrder(currentOrder)
    // If there is a currently selected song keep it at the beginning
    if (selected) {
      // Remove selected from elsewhere in the shuffle
      order.trackOrder.splice(findIndexInOrder(order, selected.id), 1)
      // Then place it at the beginning
      order.trackIndexes[selected.id] = 0
      order.trackOrder.unshift({ trackId: selected.id, orderId: selected.id })
    }
    currentOrder = order
  }

  return {
    ...currentOrder,
    selectedIndex: findIndexInOrder(currentOrder, selected?.id),
  }
}

export const setInitialOrder = (
  tracks: Tracks,
  {
    shuffle,
    repeat,
    upNextIds,
  }: {
    shuffle: boolean
    repeat: Repeat
    upNextIds: TrackId[]
  }
): Pick<
  Machine.PlayerContext,
  | 'tracks'
  | 'tracksById'
  | 'songOrder'
  | 'videoOrder'
  | 'order'
  | 'upNext'
  | 'videoSongOrder'
  | 'currentOrder'
> => {
  const tracksById = {} as Machine.PlayerContext['tracksById']
  const songOrder = emptyTrackOrder()
  const videoOrder = emptyTrackOrder()
  const upNext = emptyTrackOrder()
  const videoSongOrder: {
    [key in VideoId]?: Machine.TrackOrderUnselected
  } = {}

  for (let i = 0, m = tracks.length; i < m; i++) {
    const track = tracks[i]
    tracksById[track.id] = track

    if (track.isSong) {
      setOrderAndIndex(songOrder, { trackId: track.id, orderId: track.id })
      setOrderAndIndex(
        videoSongOrder[track.videoId] ??
          (videoSongOrder[track.videoId] = emptyTrackOrder()),
        { trackId: track.id, orderId: track.id }
      )
    } else {
      setOrderAndIndex(videoOrder, { trackId: track.id, orderId: track.id })
    }
  }

  for (let i = 0, m = upNextIds.length; i < m; i++) {
    const id = upNextIds[i]
    if (tracksById[id]) {
      setOrderAndIndex(upNext, {
        trackId: id,
        orderId: generateOrderId(id),
      })
    }
  }

  const hasUpNext = upNext.trackOrder.length > 0

  return {
    tracks,
    tracksById,
    songOrder,
    videoOrder,
    videoSongOrder,
    currentOrder: hasUpNext ? 'upNext' : 'order',
    upNext: {
      ...upNext,
      selectedIndex: hasUpNext ? 0 : -1,
    },
    order: setOrder({
      tracksById,
      shuffle,
      repeat,
      songOrder,
      videoOrder,
      videoSongOrder,
    }),
  }
}

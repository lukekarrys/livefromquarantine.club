import { Tracks, Track } from "../types"
import * as Machine from "./types"
import shuffleArray from "../lib/shuffle-array"
import { defaultSongMode } from "./selectors"

export const order = (
  tracks: Tracks,
  filter?: (t: Track) => boolean,
  selected?: Track
): Machine.TrackOrder => {
  let selectedIndex: number | null = null
  const order: Required<Omit<Machine.TrackOrder, "selectedIndex">> = {
    trackOrder: [],
    trackIndexes: {} as Machine.TrackOrder["trackIndexes"],
  }

  for (let i = 0, m = tracks.length; i < m; i++) {
    const track = tracks[i]
    if (!filter || filter(track)) {
      const position = order.trackOrder.push(track.id)
      order.trackIndexes[track.id] = position - 1
      if (selected && track.id === selected.id && selectedIndex === null) {
        selectedIndex = position - 1
      }
    } else {
      order.trackIndexes[track.id] = -1
    }
  }

  return {
    ...order,
    selectedIndex: selectedIndex ?? -1,
  }
}

export const shuffle = (
  tracks: Tracks,
  selected?: Track
): Machine.TrackOrder => {
  const shuffleOrder = shuffleArray(tracks)
  const songMode = selected?.isSong || defaultSongMode
  if (selected) {
    shuffleOrder.unshift(selected)
  }
  return order(shuffleOrder, (t) => t.isSong === songMode, selected)
}

export const initial = (
  tracks: Tracks,
  { selected, shuffle: _shuffle }: { selected?: Track; shuffle: boolean }
): Pick<
  Machine.PlayerContextReady,
  "tracks" | "tracksById" | "songOrder" | "videoOrder" | "order"
> => {
  const tracksById = tracks.reduce<Machine.PlayerContextReady["tracksById"]>(
    (acc, track: Track) => {
      acc[track.id] = track
      return acc
    },
    {} as Machine.PlayerContextReady["tracksById"]
  )

  const songOrder = order(tracks, (t) => t.isSong, selected)
  const videoOrder = order(tracks, (t) => !t.isSong, selected)

  return {
    tracks,
    tracksById,
    songOrder,
    videoOrder,
    order: _shuffle
      ? shuffle(tracks)
      : videoOrder.selectedIndex >= 0
      ? videoOrder
      : songOrder,
  }
}

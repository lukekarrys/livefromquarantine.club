import { Tracks, Track, TrackId } from "../types"

type TrackOrder = {
  trackIndexes: { [key in TrackId]: number }
  trackOrder: TrackId[]
  selectedIndex: number
}

export type TracksContext = {
  tracks: Tracks
  tracksById: { [key in TrackId]?: Track }
  order: TrackOrder
  songOrder: Omit<TrackOrder, "selectedIndex">
  videoOrder: Omit<TrackOrder, "selectedIndex">
}

export const assignTracksOrder = <TContext, TEvent>(
  assigner:
    | (<TContext, TEvent>(
        context: TContext,
        event: TEvent
      ) => Partial<TrackOrder>)
    | Partial<TrackOrder>
) => (context: TContext, event: TEvent): TracksContext =>
  ({
    ...context.tracks,
    order: {
      ...context.tracks.order,
      ...(typeof assigner === "function" ? assigner(context, event) : assigner),
    },
  } as TracksContext)

export const generateTracksOrder = (
  tracks: Tracks,
  filter?: (t: Track) => boolean,
  selectedId?: TrackId
): TrackOrder => {
  let selectedIndex: number | null = null
  const order: Omit<TrackOrder, "selectedIndex"> = {
    trackOrder: [],
    trackIndexes: {} as TrackOrder["trackIndexes"],
  }

  for (let i = 0, m = tracks.length; i < m; i++) {
    const track = tracks[i]
    if (!filter || filter(track)) {
      const position = order.trackOrder.push(track.id)
      order.trackIndexes[track.id] = position - 1
      if (selectedId && track.id === selectedId && selectedIndex === null) {
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

export const generateInitialTracksOrder = (
  tracks: Tracks,
  selectedId?: TrackId
): TracksContext => {
  const tracksById = tracks.reduce<TracksContext["tracksById"]>(
    (acc, track: Track) => {
      acc[track.id] = track
      return acc
    },
    {} as TracksContext["tracksById"]
  )

  const songOrder = generateTracksOrder(tracks, (t) => t.isSong, selectedId)
  const videoOrder = generateTracksOrder(tracks, (t) => !t.isSong, selectedId)

  return {
    tracks,
    tracksById,
    songOrder,
    videoOrder,
    order: videoOrder.selectedIndex >= 0 ? videoOrder : songOrder,
  }
}

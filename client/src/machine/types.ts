import { StateMachine, EventObject } from "@xstate/fsm"
import { Tracks, Track, Repeat, TrackId } from "../types"

export type FetchStartEvent = { type: "FETCH_START" }
export type FetchSuccessEvent = {
  type: "FETCH_SUCCESS"
  tracks: Tracks
  trackId?: TrackId
}
export type FetchErrorEvent = { type: "FETCH_ERROR"; error: Error }
export type PlayerReadyEvent = { type: "PLAYER_READY"; player: YT.Player }
export type SelectTrackEvent = { type: "SELECT_TRACK"; trackId: TrackId }
export type PlayEvent = { type: "PLAY" }
export type PauseEvent = { type: "PAUSE" }
export type NextEvent = { type: "NEXT" }
export type ShuffleEvent = { type: "SHUFFLE" }
export type EndEvent = { type: "END" }
export type YouTubePlayEvent = { type: "YOUTUBE_PLAY" }
export type YouTubePauseEvent = { type: "YOUTUBE_PAUSE" }
export type YouTubeBufferingEvent = { type: "YOUTUBE_BUFFERING" }
export type YouTubeCuedEvent = { type: "YOUTUBE_CUED" }

export type YouTubeEvent =
  | YouTubePlayEvent
  | YouTubePauseEvent
  | YouTubeBufferingEvent
  | YouTubeCuedEvent
  | EndEvent

export type PlayerEvent =
  | SelectTrackEvent
  | PlayerReadyEvent
  | PlayEvent
  | PauseEvent
  | NextEvent
  | EndEvent
  | YouTubeEvent
  | ShuffleEvent
  | FetchSuccessEvent
  | FetchErrorEvent
  | FetchStartEvent

export type TrackOrder = {
  trackIndexes: { [key in TrackId]: number }
  trackOrder: TrackId[]
  selectedIndex: number
}

export type TrackOrderUnselected = Omit<TrackOrder, "selectedIndex">

export interface PlayerContext {
  tracks?: Tracks
  tracksById?: { [key in TrackId]?: Track }
  order?: Partial<TrackOrder>
  songOrder?: Partial<TrackOrderUnselected>
  videoOrder?: Partial<TrackOrderUnselected>
  player?: YT.Player
  error?: Error
  shuffle: boolean
  repeat: Repeat
}

export interface PlayerContextNotReady {
  tracks: undefined
  tracksById: undefined
  order: undefined
  songOrder: undefined
  videoOrder: undefined
  player: undefined
}

export interface PlayerContextReady {
  tracks: Tracks
  tracksById: { [key in TrackId]?: Track }
  order: TrackOrder
  songOrder: Omit<TrackOrder, "selectedIndex">
  videoOrder: Omit<TrackOrder, "selectedIndex">
  player: YT.Player
  error: undefined
}

export type PlayerState =
  | {
      value: "idle"
      context: PlayerContext & PlayerContextNotReady
    }
  | {
      value: "loading"
      context: PlayerContext & PlayerContextNotReady
    }
  | {
      value: "error"
      context: PlayerContext &
        PlayerContextNotReady & {
          error: Error
        }
    }
  | { value: "ready"; context: PlayerContext & PlayerContextReady }
  | { value: "requesting"; context: PlayerContext & PlayerContextReady }
  | { value: "playing"; context: PlayerContext & PlayerContextReady }
  | { value: "paused"; context: PlayerContext & PlayerContextReady }

type SingleOrArray<T> = T[] | T

export type PlayerTransition<TEvent extends EventObject> = {
  [K in TEvent["type"]]: SingleOrArray<
    StateMachine.Transition<PlayerContext, TEvent>
  >
}
export type PlayerMachineSend = (
  event: PlayerEvent | PlayerEvent["type"]
) => void

export type PlayerMachineState = StateMachine.State<
  PlayerContext,
  PlayerEvent,
  PlayerState
>

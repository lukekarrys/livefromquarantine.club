import { StateMachine, EventObject } from '@xstate/fsm'
import {
  Tracks,
  Track,
  Repeat,
  TrackId,
  VideoId,
  SelectMode,
  OrderId,
} from '../types'

export type FetchStartEvent = { type: 'FETCH_START' }
export type FetchSuccessEvent = {
  type: 'FETCH_SUCCESS'
  tracks: Tracks
  shuffle?: boolean
  repeat?: Repeat
  selectMode?: SelectMode
  trackIds: TrackId[]
}
export type FetchErrorEvent = { type: 'FETCH_ERROR'; error: Error }

export type PlayerReadyEvent = { type: 'PLAYER_READY'; player: YT.Player }
export type PlayerErrorEvent = { type: 'PLAYER_ERROR'; error: Error }

export type SelectTrackEvent = {
  type: 'SELECT_TRACK'
  order: PlayerContext['currentOrder']
  orderId: OrderId
  trackId: TrackId
  forcePlay?: boolean
}
export type RemoveTrackEvent = {
  type: 'REMOVE_TRACK'
  order: PlayerContext['currentOrder']
  id: OrderId
}
export type RemoveAllTracksEvent = {
  type: 'REMOVE_ALL_TRACKS'
  order: PlayerContext['currentOrder']
}

export type NextEvent = { type: 'NEXT_TRACK' }
export type EndEvent = { type: 'END_TRACK' }

export type PlayEvent = { type: 'PLAY' }
export type PauseEvent = { type: 'PAUSE' }

export type ShuffleEvent = { type: 'SHUFFLE' }
export type RepeatEvent = { type: 'REPEAT' }

export type YouTubePlayEvent = { type: 'YOUTUBE_PLAY' }
export type YouTubePauseEvent = { type: 'YOUTUBE_PAUSE' }
export type YouTubeBufferingEvent = { type: 'YOUTUBE_BUFFERING' }
export type YouTubeCuedEvent = { type: 'YOUTUBE_CUED' }

export type YouTubeEvent =
  | YouTubePlayEvent
  | YouTubePauseEvent
  | YouTubeBufferingEvent
  | YouTubeCuedEvent
  | EndEvent

export type PlayerEvent =
  | SelectTrackEvent
  | RemoveTrackEvent
  | RemoveAllTracksEvent
  | PlayerReadyEvent
  | PlayerErrorEvent
  | PlayEvent
  | PauseEvent
  | NextEvent
  | EndEvent
  | YouTubeEvent
  | ShuffleEvent
  | RepeatEvent
  | FetchSuccessEvent
  | FetchErrorEvent
  | FetchStartEvent

export type TrackOrder = {
  trackIndexes: { [key in OrderId]?: number }
  trackOrder: { trackId: TrackId; orderId: OrderId }[]
  selectedIndex: number
}

export type TrackOrderUnselected = Omit<TrackOrder, 'selectedIndex'>

export interface PlayerContext {
  tracks: Tracks
  tracksById: { [key in TrackId]?: Track }
  currentOrder: 'order' | 'upNext'
  order: TrackOrder
  upNext: TrackOrder
  songOrder: TrackOrderUnselected
  videoOrder: TrackOrderUnselected
  videoSongOrder: { [key in VideoId]?: TrackOrderUnselected }
  player?: YT.Player
  error?: Error
  shuffle: boolean
  repeat: Repeat
  selectMode: SelectMode
}

interface PlayerContextNotReady {
  player: undefined
}

interface PlayerContextReady {
  player: YT.Player
  error: undefined
}

export type PlayerState =
  | {
      value: 'idle'
      context: PlayerContext & PlayerContextNotReady
    }
  | {
      value: 'loading'
      context: PlayerContext & PlayerContextNotReady
    }
  | {
      value: 'error'
      context: PlayerContext &
        PlayerContextNotReady & {
          error: Error
        }
    }
  | { value: 'ready'; context: PlayerContext & PlayerContextReady }
  | { value: 'requesting'; context: PlayerContext & PlayerContextReady }
  | { value: 'playing'; context: PlayerContext & PlayerContextReady }
  | { value: 'paused'; context: PlayerContext & PlayerContextReady }

type SingleOrArray<T> = T[] | T

export type PlayerTransition<TEvent extends EventObject> = {
  [K in TEvent['type']]: SingleOrArray<
    StateMachine.Transition<PlayerContext, TEvent>
  >
}
export type PlayerSend = (event: PlayerEvent | PlayerEvent['type']) => void

export type PlayerService = StateMachine.Service<
  PlayerContext,
  PlayerEvent,
  PlayerState
>

export type PlayerMachineState = StateMachine.State<
  PlayerContext,
  PlayerEvent,
  PlayerState
>

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
import MediaPlayer from '../lib/MediaPlayer'

export type FetchStartEvent = { type: 'FETCH_START' }
export type FetchSuccessEvent = {
  type: 'FETCH_SUCCESS'
  tracks: Tracks
  shuffle?: boolean
  repeat?: Repeat
  selectMode?: SelectMode
  trackIds?: TrackId[]
}
export type FetchErrorEvent = { type: 'FETCH_ERROR'; error: Error }

export type PlayerReadyEvent = {
  type: 'PLAYER_READY'
  player: YT.Player | HTMLAudioElement
}
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
export type EndEvent = { type: 'MEDIA_END_TRACK' }

export type PlayEvent = { type: 'PLAY' }
export type PauseEvent = { type: 'PAUSE' }

export type ShuffleEvent = { type: 'SHUFFLE' }
export type RepeatEvent = { type: 'REPEAT' }
export type SelectModeEvent = { type: 'SELECT_MODE' }

export type MediaPlayEvent = { type: 'MEDIA_PLAY' }
export type MediaPauseEvent = { type: 'MEDIA_PAUSE' }
export type MediaBufferingEvent = { type: 'MEDIA_BUFFERING' }
export type MediaCuedEvent = { type: 'MEDIA_CUED' }

export type MediaEvent =
  | MediaPlayEvent
  | MediaPauseEvent
  | MediaBufferingEvent
  | MediaCuedEvent
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
  | MediaEvent
  | ShuffleEvent
  | RepeatEvent
  | SelectModeEvent
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
  player?: MediaPlayer
  error?: Error
  shuffle: boolean
  repeat: Repeat
  selectMode: SelectMode
}

interface PlayerContextNotReady {
  player: undefined
}

interface PlayerContextReady {
  player: MediaPlayer
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

// https://github.com/davidkpiano/xstate/discussions/1591#discussioncomment-111941
export function assertEventType<
  TE extends EventObject,
  TType extends TE['type']
>(
  event: TE,
  eventType: TType | TType[]
): asserts event is TE & { type: TType } {
  if (
    Array.isArray(eventType)
      ? !eventType.includes(event.type as TType)
      : event.type !== eventType
  ) {
    throw new Error(
      `Invalid event: expected "${
        Array.isArray(eventType) ? eventType.join(',') : eventType
      }", got "${event.type}"`
    )
  }
}

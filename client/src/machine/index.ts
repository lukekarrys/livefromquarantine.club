import { createMachine, assign, StateMachine, EventObject } from "@xstate/fsm"
import { Tracks, Track, Repeat, TrackId } from "../types"
import { isSeekableTrack, isNextTrack } from "../lib/compare-tracks"
import {
  generateInitialTracksOrder,
  generateTracksOrder,
  TracksContext,
} from "./track-order"
import * as debug from "../lib/debug"
import shuffleArray from "../lib/shuffle-array"

type FetchStartEvent = { type: "FETCH_START" }
type FetchSuccessEvent = {
  type: "FETCH_SUCCESS"
  tracks: Tracks
  selectedId?: TrackId
}
type FetchErrorEvent = { type: "FETCH_ERROR"; error: Error }
type PlayerReadyEvent = { type: "PLAYER_READY"; player: YT.Player }
type SelectTrackEvent = { type: "SELECT_TRACK"; trackId: TrackId }
type PlayEvent = { type: "PLAY" }
type PauseEvent = { type: "PAUSE" }
type NextEvent = { type: "NEXT" }
type ShuffleEvent = { type: "SHUFFLE" }
type EndEvent = { type: "END" }
type YouTubePlayEvent = { type: "YOUTUBE_PLAY" }
type YouTubePauseEvent = { type: "YOUTUBE_PAUSE" }
type YouTubeBufferingEvent = { type: "YOUTUBE_BUFFERING" }
type YouTubeCuedEvent = { type: "YOUTUBE_CUED" }

type YouTubeEvent =
  | YouTubePlayEvent
  | YouTubePauseEvent
  | YouTubeBufferingEvent
  | YouTubeCuedEvent
  | EndEvent

type PlayerEvent =
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

interface PlayerContext {
  tracks?: TracksContext
  error?: Error
  player?: YT.Player
  shuffle: boolean
  repeat: Repeat
}

interface PlayerContextReady extends PlayerContext {
  tracks: TracksContext
  error: undefined
  player: YT.Player
}

type PlayerState =
  | {
      value: "idle"
      context: PlayerContext & {
        tracks: undefined
        error: undefined
      }
    }
  | {
      value: "loading"
      context: PlayerContext & {
        tracks: undefined
        error: undefined
      }
    }
  | {
      value: "error"
      context: PlayerContext & {
        tracks: undefined
        error: Error
      }
    }
  | { value: "ready"; context: PlayerContextReady }
  | { value: "requesting"; context: PlayerContextReady }
  | { value: "playing"; context: PlayerContextReady }
  | { value: "paused"; context: PlayerContextReady }

export type PlayerMachineSend = (
  event: PlayerEvent | PlayerEvent["type"]
) => void

export type PlayerMachineState = StateMachine.State<
  PlayerContext,
  PlayerEvent,
  PlayerState
>

export const ytToMachineEvent: {
  [key in YT.PlayerState]: YouTubeEvent["type"] | null
} = {
  [-1]: null, // UNSTARTED, dont need to track this
  [0]: "END",
  [1]: "YOUTUBE_PLAY",
  [2]: "YOUTUBE_PAUSE",
  [3]: "YOUTUBE_BUFFERING",
  [5]: "YOUTUBE_CUED",
}

export const selectors = {
  hasTracks: (context: PlayerContext): boolean => {
    return !!context.tracks
  },
  getSelectedByIndex: (
    context: PlayerContext,
    index?: number
  ): Track | undefined => {
    return index === undefined
      ? undefined
      : context.tracks?.tracksById[context.tracks.order.trackOrder[index]]
  },
  getSelected: (context: PlayerContext): Track | undefined => {
    return selectors.getSelectedByIndex(
      context,
      context.tracks?.order.selectedIndex
    )
  },
  getNextSelected: (context: PlayerContext): Track | undefined => {
    return selectors.getSelectedByIndex(
      context,
      selectors.getNextIndex(context)
    )
  },
  getEventTrack: (
    context: PlayerContext,
    event: SelectTrackEvent
  ): Track | undefined => {
    return context.tracks?.tracksById[event.trackId]
  },
  hasSelected: (context: PlayerContext): boolean => {
    return selectors.getSelected(context) !== undefined
  },
  getNextIndex: (context: PlayerContext): number | undefined => {
    const selectedIndex = context.tracks?.order.selectedIndex
    const trackOrder = context.tracks?.order.trackOrder

    if (selectedIndex == null || trackOrder == null) return undefined

    const nextIndex = selectedIndex + 1
    return nextIndex >= trackOrder.length ? 0 : nextIndex
  },
  isNextSeekable: (context: PlayerContext): boolean => {
    const current = selectors.getSelected(context)
    const next = selectors.getNextSelected(context)
    return isSeekableTrack(current, next)
  },
  isEventSeekable: (
    context: PlayerContext,
    event: SelectTrackEvent
  ): boolean => {
    return isSeekableTrack(
      selectors.getSelected(context),
      selectors.getEventTrack(context, event)
    )
  },
  isNextNext: (context: PlayerContext): boolean => {
    const current = selectors.getSelected(context)
    const next = selectors.getNextSelected(context)
    return isNextTrack(current, next)
  },
  isPlayerReady: (context: PlayerContext): boolean => {
    return !!context.player
  },
}

type SingleOrArray<T> = T[] | T

type PlayerTransition<TEvent extends EventObject> = {
  [K in TEvent["type"]]: SingleOrArray<
    StateMachine.Transition<PlayerContext, TEvent>
  >
}

const shuffleTransition: PlayerTransition<ShuffleEvent> = {
  SHUFFLE: {
    actions: "shuffleTrackOrder",
  },
}

const playerReadyTransition: PlayerTransition<PlayerReadyEvent> = {
  PLAYER_READY: [
    {
      target: "ready",
      actions: "setPlayer",
      cond: selectors.hasTracks,
    },
    {
      actions: "setPlayer",
    },
  ],
}

const playerMachine = createMachine<PlayerContext, PlayerEvent, PlayerState>(
  {
    id: "player",
    initial: "idle",
    context: {
      tracks: undefined,
      error: undefined,
      player: undefined,
      shuffle: false,
      // TODO: implement repeat including repeat one and repeat within
      // a video (also including repeat within a video while playing a full video is the same as repeat one)
      repeat: Repeat.None,
      // TODO: implemetn up next with queueMode toggle
    },
    states: {
      idle: {
        on: {
          FETCH_START: "loading",
          // TODO: racing the player and the loading could be done on an entry condition in ready? try that later
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      loading: {
        on: {
          FETCH_SUCCESS: [
            {
              target: "ready",
              actions: "setTracks",
              cond: selectors.isPlayerReady,
            },
            {
              actions: "setTracks",
            },
          ],
          FETCH_ERROR: {
            target: "error",
            actions: "setError",
            cond: selectors.isPlayerReady,
          },
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      error: {
        on: {
          FETCH_START: "loading",
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      ready: {
        // This is not ideal but the simplest way to cue the initial selected video
        // is to call this always on entry but make it a no-op in the action
        // if there is nothing selected
        entry: "cueVideo",
        on: {
          PLAY: [
            {
              target: "requesting",
              cond: selectors.hasSelected,
              actions: "loadVideo",
            },
            {
              target: "requesting",
              actions: ["setInitialTrack", "loadVideo"],
            },
          ],
          NEXT: [
            {
              target: "requesting",
              actions: ["setNextTrack", "loadVideo"],
              cond: selectors.hasSelected,
            },
            {
              // You can click the next button on initial state and it
              // acts the same as the play button because why not
              target: "requesting",
              actions: ["setInitialTrack", "loadVideo"],
            },
          ],
          SELECT_TRACK: {
            target: "requesting",
            actions: ["setTrack", "loadVideo"],
          },
          ...shuffleTransition,
        },
      },
      requesting: {
        on: {
          YOUTUBE_BUFFERING: "playing",
          YOUTUBE_CUED: "playing",
          // I think play/pause are necessary here because its
          // not perfect to tap into YouTube's event system
          // so this ensures its can't get stuck in the requesting state
          YOUTUBE_PLAY: "playing",
          // Having pause here causes the state to go into paused when
          // switching between videos since loadVideo causes a temporary
          // pause state. removing for now to see how it works without it
          // YOUTUBE_PAUSE: "paused",
          NEXT: [
            {
              actions: ["setNextTrack", "seekTo", "playVideo"],
              cond: selectors.isNextSeekable,
            },
            {
              actions: ["setNextTrack", "loadVideo"],
            },
          ],
          SELECT_TRACK: [
            {
              actions: ["setTrack", "seekTo", "playVideo"],
              cond: selectors.isEventSeekable,
            },
            {
              actions: ["setTrack", "loadVideo"],
            },
          ],
          ...shuffleTransition,
        },
      },
      playing: {
        on: {
          PAUSE: {
            target: "paused",
            actions: "pauseVideo",
          },
          YOUTUBE_PAUSE: "paused",
          NEXT: [
            {
              target: "requesting",
              actions: ["setNextTrack", "seekTo"],
              cond: selectors.isNextSeekable,
            },
            {
              target: "requesting",
              actions: ["setNextTrack", "loadVideo"],
            },
          ],
          END: [
            {
              // No other action here so that there is seamless
              // playback when going directly from one song to another
              actions: "setNextTrack",
              cond: selectors.isNextNext,
            },
            {
              // The next track could also be in the same video for queues and shuffle
              target: "requesting",
              actions: ["setNextTrack", "seekTo"],
              cond: selectors.isNextSeekable,
            },
            {
              // Any other end event means it is the end of a video
              // so use loadVideo for the next one
              target: "requesting",
              actions: ["setNextTrack", "loadVideo"],
            },
          ],
          SELECT_TRACK: [
            {
              target: "requesting",
              actions: ["setTrack", "seekTo"],
              cond: selectors.isEventSeekable,
            },
            {
              target: "requesting",
              actions: ["setTrack", "loadVideo"],
            },
          ],
          ...shuffleTransition,
        },
      },
      paused: {
        on: {
          PLAY: {
            target: "requesting",
            actions: "playVideo",
          },
          YOUTUBE_PLAY: "playing",
          NEXT: [
            {
              actions: ["setNextTrack", "seekTo"],
              cond: selectors.isNextSeekable,
            },
            {
              actions: ["setNextTrack", "cueVideo"],
            },
          ],
          SELECT_TRACK: [
            {
              target: "requesting",
              actions: ["setTrack", "seekTo", "playVideo"],
              cond: selectors.isEventSeekable,
            },
            {
              target: "requesting",
              actions: ["setTrack", "loadVideo"],
            },
          ],
          ...shuffleTransition,
        },
      },
    },
  },
  {
    actions: {
      playVideo: (context): void => context.player?.playVideo(),
      pauseVideo: (context): void => context.player?.pauseVideo(),
      cueVideo: (context): void => {
        const selected = selectors.getSelected(context)
        if (selected) {
          context.player?.cueVideoById({
            videoId: selected.videoId,
            startSeconds: selected.start,
          })
        }
      },
      loadVideo: (context): void => {
        const selected = selectors.getSelected(context)
        if (selected) {
          context.player?.loadVideoById({
            videoId: selected.videoId,
            startSeconds: selected.start,
          })
        }
      },
      seekTo: (context): void => {
        const selected = selectors.getSelected(context)
        if (selected) {
          context.player?.seekTo(selected.start, true)
        }
      },
      setPlayer: assign<PlayerContext>({
        player: (_, event) => (event as PlayerReadyEvent).player,
      }),
      setTracks: assign<PlayerContext>({
        tracks: (_, event) => {
          // TODO: this is only ever called once per session but if it was ever
          // called more then it would need to account for shuffle and selected state
          // from context
          const fetchSuccessEvent = event as FetchSuccessEvent
          return generateInitialTracksOrder(
            fetchSuccessEvent.tracks,
            fetchSuccessEvent.selectedId
          )
        },
      }),
      setInitialTrack: assign<PlayerContext>({
        tracks: (context) => {
          return {
            ...context.tracks,
            order: {
              ...context.tracks?.order,
              selectedIndex: 0,
            },
          } as TracksContext
        },
      }),
      setNextTrack: assign<PlayerContext>({
        tracks: (context) => {
          return {
            ...context.tracks,
            order: {
              ...context.tracks?.order,
              selectedIndex:
                selectors.getNextIndex(context) ??
                context.tracks?.order.selectedIndex,
            },
          } as TracksContext
        },
      }),
      setTrack: assign<PlayerContext>({
        tracks: (context, event) => {
          const selectTrackEvent = event as SelectTrackEvent

          const songMode = selectors.getSelected(context)?.isSong ?? true
          const eventTrack = selectors.getEventTrack(context, selectTrackEvent)

          if (!eventTrack) {
            debug.error("SELECT TRACK NOT FOUND", event)
            return context.tracks
          }

          const eventSongMode = eventTrack.isSong

          const newOrder =
            songMode !== eventSongMode
              ? eventSongMode
                ? context.tracks?.songOrder
                : context.tracks?.videoOrder
              : context.tracks?.order
          const newIndex = newOrder?.trackIndexes[eventTrack.id]

          if (newIndex === undefined) {
            throw new Error(`SELECT TRACK NOT FOUND ${JSON.stringify(event)}`)
          }

          return {
            ...context.tracks,
            order: {
              ...newOrder,
              selectedIndex: newIndex,
            },
          } as TracksContext // TODO: fix these to not need as operator and to remove nullish coalescing operator
        },
      }),
      shuffleTrackOrder: assign<PlayerContext>({
        shuffle: (context) => !context.shuffle,
        tracks: (context) => {
          const shuffle = !context.shuffle
          const selected = selectors.getSelected(context)
          const songMode = selected?.isSong ?? true

          if (shuffle) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const shuffleOrder = shuffleArray(context.tracks?.tracks!)
            if (selected) shuffleOrder.unshift(selected)
            return {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ...context.tracks!,
              order: generateTracksOrder(
                shuffleOrder,
                (t) => t.isSong === songMode,
                selected?.id
              ),
            }
          }

          // TODO: fix these
          const newOrder = songMode
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              context.tracks?.songOrder!
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              context.tracks?.videoOrder!

          if (!selected) {
            return {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ...context.tracks!,
              order: {
                ...newOrder,
                selectedIndex: -1,
              },
            } as TracksContext
          }

          const newIndex = newOrder.trackIndexes[selected.id]

          if (newIndex === undefined) {
            throw new Error(
              `CURRENT TRACK NOT IN SHUFFLE ${JSON.stringify(selected)}`
            )
          }

          return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...context.tracks!,
            order: {
              ...newOrder,
              selectedIndex: newIndex,
            },
          } as TracksContext
        },
      }),
    },
  }
)

export default playerMachine

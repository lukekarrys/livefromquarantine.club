import { createMachine, assign, StateMachine, EventObject } from "@xstate/fsm"
import { Tracks, Track, Repeat, TrackId } from "../types"
import { isSeekableTrack, isNextTrack } from "./compare-tracks"
import shuffleArray from "./shuffle-array"
import * as debug from "./debug"

type TrackOrder = {
  trackIndexes: { [key in TrackId]: number }
  trackOrder: TrackId[]
  selectedIndex: number
}

interface PlayerContext {
  tracks: { [key in TrackId]?: Track }
  order: TrackOrder
  player?: YT.Player
  shuffle: boolean
  repeat: Repeat
}

type ReadyEvent = { type: "READY"; player: YT.Player }
type PlayEvent = { type: "PLAY" }
type PauseEvent = { type: "PAUSE" }
type NextEvent = { type: "NEXT" }
type SelectTrackEvent = { type: "SELECT_TRACK"; trackId: TrackId }
type EndEvent = { type: "END" }
type YouTubePlayEvent = { type: "YOUTUBE_PLAY" }
type YouTubePauseEvent = { type: "YOUTUBE_PAUSE" }
type YouTubeBufferingEvent = { type: "YOUTUBE_BUFFERING" }
type YouTubeCuedEvent = { type: "YOUTUBE_CUED" }
type ShuffleEvent = { type: "SHUFFLE" }

type YouTubeEvent =
  | YouTubePlayEvent
  | YouTubePauseEvent
  | YouTubeBufferingEvent
  | YouTubeCuedEvent
  | EndEvent

type PlayerEvent =
  | SelectTrackEvent
  | ReadyEvent
  | PlayEvent
  | PauseEvent
  | NextEvent
  | EndEvent
  | YouTubeEvent
  | ShuffleEvent

type PlayerState =
  | { value: "idle"; context: PlayerContext }
  | { value: "initial"; context: PlayerContext }
  | { value: "requesting"; context: PlayerContext }
  | { value: "playing"; context: PlayerContext }
  | { value: "paused"; context: PlayerContext }

type PlayerTransition<TEvent extends EventObject> = {
  [K in TEvent["type"]]: StateMachine.Transition<PlayerContext, TEvent>
}

export type Sender = (event: PlayerEvent | PlayerEvent["type"]) => void

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
  getSelectedByIndex: (
    context: PlayerContext,
    index?: number
  ): Track | undefined => {
    return index === undefined
      ? undefined
      : context.tracks[context.order.trackOrder[index]]
  },
  getSelected: (context: PlayerContext): Track | undefined => {
    return selectors.getSelectedByIndex(context, context.order.selectedIndex)
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
    return context.tracks[event.trackId]
  },
  hasSelected: (context: PlayerContext): boolean => {
    return selectors.getSelected(context) !== undefined
  },
  getNextIndex: (context: PlayerContext): number | undefined => {
    const {
      order: { trackOrder, selectedIndex },
    } = context

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
}

const generateOrder = (
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

const shuffleTransition: PlayerTransition<ShuffleEvent> = {
  SHUFFLE: {
    actions: "shuffleTrackOrder",
  },
}

type CreateMachine = Partial<
  Pick<PlayerContext, "repeat" | "shuffle" | "player">
> & {
  tracks: Tracks
  selectedId?: TrackId
}

const playerMachine = ({
  tracks: ORIGINAL_TRACKS,
  selectedId,
  shuffle = false,
  repeat = Repeat.None,
  player,
}: CreateMachine): StateMachine.Machine<
  PlayerContext,
  PlayerEvent,
  PlayerState
> => {
  const tracksById = ORIGINAL_TRACKS.reduce<PlayerContext["tracks"]>(
    (acc, track: Track) => {
      acc[track.id] = track
      return acc
    },
    {} as PlayerContext["tracks"]
  )

  const defaultSongOrder = generateOrder(
    ORIGINAL_TRACKS,
    (t) => t.isSong,
    selectedId
  )

  const defaultVideoOrder = generateOrder(
    ORIGINAL_TRACKS,
    (t) => !t.isSong,
    selectedId
  )

  return createMachine<PlayerContext, PlayerEvent, PlayerState>(
    {
      id: "player",
      initial: "idle",
      context: {
        tracks: tracksById,
        order: defaultSongOrder,
        shuffle,
        repeat, // TODO: implement repeat including repeat one and repeat within
        // a video (also including repeat within a video while playing a full video is the same as repeat one)
        player,
        // TODO: implemetn up next with queueMode toggle
      },
      states: {
        idle: {
          on: {
            READY: [
              {
                target: "initial",
                actions: ["setPlayer", "cueVideo"],
                cond: selectors.hasSelected,
              },
              {
                actions: "setPlayer",
                target: "initial",
              },
            ],
            ...shuffleTransition,
          },
        },
        initial: {
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
          player: (_, event) => (event as ReadyEvent).player,
        }),
        setInitialTrack: assign<PlayerContext>({
          order: (context) => {
            return {
              ...context.order,
              selectedIndex: 0,
            }
          },
        }),
        setNextTrack: assign<PlayerContext>({
          order: (context) => {
            return {
              ...context.order,
              selectedIndex:
                selectors.getNextIndex(context) ?? context.order.selectedIndex,
            }
          },
        }),
        setTrack: assign<PlayerContext>({
          order: (context, event) => {
            const selectTrackEvent = event as SelectTrackEvent

            const songMode = selectors.getSelected(context)?.isSong ?? true
            const eventTrack = selectors.getEventTrack(
              context,
              selectTrackEvent
            )

            if (!eventTrack) {
              debug.error("SELECT TRACK NOT FOUND", event)
              return context.order
            }

            const eventSongMode = eventTrack.isSong

            const newOrder =
              songMode !== eventSongMode
                ? eventSongMode
                  ? defaultSongOrder
                  : defaultVideoOrder
                : context.order
            const newIndex = newOrder.trackIndexes[eventTrack.id]

            if (newIndex === undefined) {
              throw new Error(`SELECT TRACK NOT FOUND ${JSON.stringify(event)}`)
            }

            return {
              ...newOrder,
              selectedIndex: newIndex,
            }
          },
        }),
        shuffleTrackOrder: assign<PlayerContext>({
          shuffle: (context) => !context.shuffle,
          order: (context) => {
            const shuffle = !context.shuffle
            const selected = selectors.getSelected(context)
            const songMode = selected?.isSong ?? true

            if (shuffle) {
              const shuffleOrder = shuffleArray(ORIGINAL_TRACKS)
              if (selected) shuffleOrder.unshift(selected)
              return generateOrder(
                shuffleOrder,
                (t) => t.isSong === songMode,
                selected?.id
              )
            }

            const newOrder = songMode ? defaultSongOrder : defaultVideoOrder

            if (!selected) {
              return newOrder
            }

            const newIndex = newOrder.trackIndexes[selected.id]

            if (newIndex === undefined) {
              throw new Error(
                `CURRENT TRACK NOT IN SHUFFLE ${JSON.stringify(selected)}`
              )
            }

            return {
              ...newOrder,
              selectedIndex: newIndex,
            }
          },
        }),
      },
    }
  )
}

export default playerMachine

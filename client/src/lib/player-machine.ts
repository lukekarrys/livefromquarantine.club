import { createMachine, assign, StateMachine } from "@xstate/fsm"
import { Tracks, Track, Repeat } from "../types"
import { isSeekableTrack, isNextTrack } from "./compare-tracks"

interface PlayerContext {
  tracks: Tracks
  player?: YT.Player
  selectedIndex: number
  shuffle: boolean
  repeat: Repeat
}

type SelectTrackEvent = { type: "SELECT_TRACK"; track: Track }
type ReadyEvent = { type: "READY"; player: YT.Player }
type PlayEvent = { type: "PLAY" }
type PauseEvent = { type: "PAUSE" }
type NextEvent = { type: "NEXT" }
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
  | ReadyEvent
  | PlayEvent
  | PauseEvent
  | NextEvent
  | EndEvent
  | YouTubeEvent

type PlayerState =
  | { value: "idle"; context: PlayerContext }
  | { value: "initial"; context: PlayerContext }
  | { value: "requesting"; context: PlayerContext }
  | { value: "playing"; context: PlayerContext }
  | { value: "paused"; context: PlayerContext }

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

const findNextIndex = <T>(
  arr: T[],
  startIndex: number,
  cond: (arg: T) => boolean
): number => {
  for (let i = startIndex + 1, m = arr.length; i < m; i++) {
    const item: T = arr[i]
    if (cond(item)) return i
  }
  return 0
}

const getSelected = (context: PlayerContext): Track | undefined =>
  context.tracks[context.selectedIndex]

const hasSelected = (context: PlayerContext): boolean => !!getSelected(context)

const getNextIndex = (context: PlayerContext): number => {
  const current = getSelected(context)
  return findNextIndex<Track>(context.tracks, context.selectedIndex, (t) =>
    current ? t.isSong === current.isSong : true
  )
}

const getNextSelected = (context: PlayerContext): Track | undefined => {
  const nextIndex = getNextIndex(context)
  return context.tracks[nextIndex]
}

const isNextSeekable = (context: PlayerContext): boolean => {
  const current = getSelected(context)
  const next = getNextSelected(context)
  return isSeekableTrack(current, next)
}

const isEventSeekable = (
  context: PlayerContext,
  event: SelectTrackEvent
): boolean => isSeekableTrack(getSelected(context), event.track)

const isNextNext = (context: PlayerContext): boolean => {
  const current = getSelected(context)
  const next = getNextSelected(context)
  return isNextTrack(current, next)
}

const playerMachine = ({
  tracks,
  selectedIndex,
}: {
  tracks: Tracks
  selectedIndex: number
}): StateMachine.Machine<PlayerContext, PlayerEvent, PlayerState> =>
  createMachine<PlayerContext, PlayerEvent, PlayerState>(
    {
      id: "player",
      initial: "idle",
      context: {
        tracks,
        selectedIndex,
        shuffle: false, // TODO:  implement  shuffle
        repeat: Repeat.None, // TODO: implement repeat
        player: undefined,
        // TODO: implemetn up next with queueMode toggle
      },
      states: {
        idle: {
          on: {
            READY: [
              {
                target: "initial",
                actions: ["setPlayer", "cueVideo"],
                cond: hasSelected,
              },
              {
                actions: "setPlayer",
                target: "initial",
              },
            ],
          },
        },
        initial: {
          on: {
            PLAY: [
              {
                target: "requesting",
                cond: hasSelected,
              },
              {
                target: "requesting",
                actions: "setInitialTrack",
              },
            ],
            NEXT: [
              {
                target: "requesting",
                actions: "setNextTrack",
                cond: hasSelected,
              },
              {
                // You can click the next button on initial state and it
                // acts the same as the play button because why not
                target: "requesting",
                actions: "setInitialTrack",
              },
            ],
            SELECT_TRACK: {
              target: "requesting",
              actions: "setTrack",
            },
          },
          // Load the video before exiting to the requesting state
          exit: "loadVideo",
        },
        requesting: {
          on: {
            YOUTUBE_BUFFERING: "playing",
            YOUTUBE_CUED: "playing",
            // I think play/pause are necessary here because its
            // not perfect to tap into YouTube's event system
            // so this ensures its can't get stuck in the requesting state
            YOUTUBE_PLAY: "playing",
            YOUTUBE_PAUSE: "paused",
            NEXT: [
              {
                actions: ["setNextTrack", "seekTo", "playVideo"],
                cond: isNextSeekable,
              },
              {
                actions: ["setNextTrack", "loadVideo"],
              },
            ],
            SELECT_TRACK: [
              {
                actions: ["setTrack", "seekTo", "playVideo"],
                cond: isEventSeekable,
              },
              {
                actions: ["setTrack", "loadVideo"],
              },
            ],
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
                cond: isNextSeekable,
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
                // TODO: what should happen in shuffle mode? if you are going to
                // the next song would you expect it to noy play seamlessly?
                cond: isNextNext,
              },
              {
                // The next track could also be in the same video for queues and shuffle
                target: "requesting",
                actions: ["setNextTrack", "seekTo"],
                cond: isNextSeekable,
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
                cond: isEventSeekable,
              },
              {
                target: "requesting",
                actions: ["setTrack", "loadVideo"],
              },
            ],
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
                target: "requesting",
                actions: ["setNextTrack", "seekTo"],
                cond: isNextSeekable,
              },
              {
                target: "requesting",
                actions: ["setNextTrack", "cueVideo"],
              },
            ],
            SELECT_TRACK: [
              {
                target: "requesting",
                actions: ["setTrack", "seekTo", "playVideo"],
                cond: isEventSeekable,
              },
              {
                target: "requesting",
                actions: ["setTrack", "loadVideo"],
              },
            ],
          },
        },
      },
    },
    {
      actions: {
        playVideo: (context): void => context.player?.playVideo(),
        pauseVideo: (context): void => context.player?.pauseVideo(),
        cueVideo: (context): void => {
          const selected = getSelected(context)
          if (selected) {
            context.player?.cueVideoById({
              videoId: selected.videoId,
              startSeconds: selected.start,
            })
          }
        },
        loadVideo: (context): void => {
          const selected = getSelected(context)
          if (selected) {
            context.player?.loadVideoById({
              videoId: selected.videoId,
              startSeconds: selected.start,
            })
          }
        },
        seekTo: (context): void => {
          const selected = getSelected(context)
          if (selected) {
            context.player?.seekTo(selected.start, true)
          }
        },
        setPlayer: assign<PlayerContext>({
          player: (context, event) => (event as ReadyEvent).player,
        }),
        setInitialTrack: assign<PlayerContext>({
          // If not shuffled then the first index is a full show,
          // so we use the first index which is the first song
          selectedIndex: (context) => (context.shuffle ? 0 : 1),
        }),
        setNextTrack: assign<PlayerContext>({
          selectedIndex: getNextIndex,
        }),
        setTrack: assign<PlayerContext>({
          selectedIndex: (context, event) =>
            context.tracks.findIndex(
              (t) => t.id === (event as SelectTrackEvent).track.id
            ),
        }),
      },
    }
  )

export default playerMachine

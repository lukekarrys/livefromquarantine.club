import { createMachine, assign, StateMachine } from "@xstate/fsm"
import { Videos, Tracks, Track, Repeat } from "../types"

interface PlayerContext {
  tracks: Tracks
  videos: Videos
  selectedIndex: number
  shuffle: boolean
  repeat: Repeat
}

type SelectTrackEvent = { type: "SELECT_TRACK"; track: Track }

export type PlayerEvent =
  | { type: "READY" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "YOUTUBE_PLAY" }
  | { type: "YOUTUBE_PAUSE" }
  | { type: "YOUTUBE_BUFFERING" }
  | { type: "YOUTUBE_CUED" }
  | { type: "NEXT" }
  | { type: "END" }
  | SelectTrackEvent

type PlayerState =
  | { value: "idle"; context: PlayerContext }
  | { value: "initial"; context: PlayerContext }
  | { value: "requestingPlay"; context: PlayerContext }
  | { value: "playing"; context: PlayerContext }
  | { value: "paused"; context: PlayerContext }

export type Sender = (event: PlayerEvent | PlayerEvent["type"]) => void

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

const playerMachine = ({
  videos,
  tracks,
  selectedIndex,
}: {
  videos: Videos
  tracks: Tracks
  selectedIndex: number
}): StateMachine.Machine<PlayerContext, PlayerEvent, PlayerState> =>
  createMachine<PlayerContext, PlayerEvent, PlayerState>(
    {
      id: "player",
      initial: "idle",
      context: {
        videos: videos ?? [],
        tracks: tracks ?? [],
        selectedIndex: selectedIndex ?? -1,
        shuffle: false,
        repeat: Repeat.None,
      },
      states: {
        idle: {
          on: {
            READY: "initial",
          },
        },
        initial: {
          // TODO: allow playing from initial state, clicking play should play the first song
          // unless one has been passed in from props
          on: {
            PLAY: "requestingPlay",
            YOUTUBE_PLAY: "playing",
            NEXT: {
              target: "requestingPlay",
              actions: "findNextIndex",
            },
            SELECT_TRACK: {
              target: "requestingPlay",
              actions: "selectTrack",
            },
          },
        },
        requestingPlay: {
          on: {
            // TODO: this cant go here: what if youtube doesnt buffer a song
            // change, it would be stuck?
            YOUTUBE_BUFFERING: "playing",
            YOUTUBE_CUED: "playing",
            NEXT: {
              actions: "findNextIndex",
            },
            SELECT_TRACK: {
              actions: "selectTrack",
            },
          },
        },
        playing: {
          on: {
            PAUSE: "paused",
            YOUTUBE_PAUSE: "paused",
            NEXT: {
              target: "requestingPlay",
              actions: "findNextIndex",
            },
            END: {
              target: "requestingPlay",
              actions: "findNextIndex",
            },
            SELECT_TRACK: {
              target: "requestingPlay",
              actions: "selectTrack",
            },
          },
        },
        paused: {
          on: {
            PLAY: "requestingPlay",
            YOUTUBE_PLAY: "playing",
            NEXT: {
              target: "requestingPlay",
              actions: "findNextIndex",
            },
            SELECT_TRACK: {
              target: "requestingPlay",
              actions: "selectTrack",
            },
          },
        },
      },
    },
    {
      actions: {
        findNextIndex: assign<PlayerContext>({
          selectedIndex: (context) => {
            const current = context.tracks[context.selectedIndex]
            return findNextIndex<Track>(
              context.tracks,
              context.selectedIndex,
              (t) => (current ? t.isSong === current.isSong : true)
            )
          },
        }),
        selectTrack: assign<PlayerContext>({
          selectedIndex: (context, event) => {
            return context.tracks.findIndex(
              (t) => t.id === (event as SelectTrackEvent).track.id
            )
          },
        }),
      },
    }
  )

export default playerMachine

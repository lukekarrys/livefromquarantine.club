import { createMachine, assign } from '@xstate/fsm'
import { Repeat, Track } from '../types'
import * as Machine from './types'
import * as selectors from './selectors'
import * as trackOrder from './track-order'
import * as debug from '../lib/debug'

export const ytToMachineEvent: {
  [key in YT.PlayerState]: Machine.YouTubeEvent['type'] | null
} = {
  [-1]: null, // UNSTARTED, dont need to track this
  [0]: 'END',
  [1]: 'YOUTUBE_PLAY',
  [2]: 'YOUTUBE_PAUSE',
  [3]: 'YOUTUBE_BUFFERING',
  [5]: 'YOUTUBE_CUED',
}

const shuffleTransition: Machine.PlayerTransition<Machine.ShuffleEvent> = {
  SHUFFLE: {
    actions: 'setTrackOrder',
  },
}

const repeatTransition: Machine.PlayerTransition<Machine.RepeatEvent> = {
  REPEAT: {
    actions: 'setTrackOrder',
  },
}

const alwaysTransitions = {
  ...shuffleTransition,
  ...repeatTransition,
}

const playerReadyTransition: Machine.PlayerTransition<Machine.PlayerReadyEvent> = {
  PLAYER_READY: [
    {
      target: 'requesting',
      actions: ['setPlayer', 'loadVideo'],
      cond: selectors.hasSelected,
    },
    {
      target: 'ready',
      actions: 'setPlayer',
      cond: selectors.hasTracks,
    },
    {
      target: 'ready',
      actions: 'setPlayer',
      cond: selectors.hasTracks,
    },
    {
      actions: 'setPlayer',
    },
  ],
}

const playerMachine = createMachine<
  Machine.PlayerContext,
  Machine.PlayerEvent,
  Machine.PlayerState
>(
  {
    id: 'player',
    initial: 'idle',
    context: {
      tracks: [],
      tracksById: {},
      songOrder: {
        trackIndexes: {},
        trackOrder: [],
      },
      videoOrder: {
        trackIndexes: {},
        trackOrder: [],
      },
      videoSongOrder: {},
      order: {
        trackIndexes: {},
        trackOrder: [],
        selectedIndex: -1,
      },
      error: undefined,
      player: undefined,
      shuffle: false,
      repeat: Repeat.None,
      // TODO: implemetn up next with queueMode toggle
    },
    states: {
      idle: {
        on: {
          FETCH_START: 'loading',
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      loading: {
        on: {
          FETCH_SUCCESS: [
            {
              target: 'requesting',
              actions: ['setTracks', 'loadVideo'],
              cond: selectors.hasSelected,
            },
            {
              target: 'ready',
              actions: 'setTracks',
              cond: selectors.isPlayerReady,
            },
            {
              actions: 'setTracks',
            },
          ],
          FETCH_ERROR: {
            target: 'error',
            actions: 'setError',
            cond: selectors.isPlayerReady,
          },
          ...playerReadyTransition,
          ...alwaysTransitions,
        },
      },
      error: {
        on: {
          FETCH_START: 'loading',
          ...playerReadyTransition,
          ...alwaysTransitions,
        },
      },
      ready: {
        on: {
          PLAY: [
            {
              target: 'requesting',
              cond: selectors.hasSelected,
              actions: 'loadVideo',
            },
            {
              target: 'requesting',
              actions: ['setInitialTrack', 'loadVideo'],
            },
          ],
          NEXT: [
            {
              target: 'requesting',
              actions: ['setNextTrack', 'loadVideo'],
              cond: selectors.hasSelected,
            },
            {
              // You can click the next button on initial state and it
              // acts the same as the play button because why not
              target: 'requesting',
              actions: ['setInitialTrack', 'loadVideo'],
            },
          ],
          SELECT_TRACK: {
            target: 'requesting',
            actions: ['setTrack', 'loadVideo'],
          },
          ...alwaysTransitions,
        },
      },
      requesting: {
        on: {
          YOUTUBE_BUFFERING: 'playing',
          YOUTUBE_CUED: 'playing',
          // I think play/pause are necessary here because its
          // not perfect to tap into YouTube's event system
          // so this ensures its can't get stuck in the requesting state
          YOUTUBE_PLAY: 'playing',
          // Having pause here causes the state to go into paused when
          // switching between videos since loadVideo causes a temporary
          // pause state. removing for now to see how it works without it
          // YOUTUBE_PAUSE: "paused",
          NEXT: [
            {
              actions: ['setNextTrack', 'seekTo', 'playVideo'],
              cond: selectors.isNextSeekable,
            },
            {
              actions: ['setNextTrack', 'loadVideo'],
            },
          ],
          SELECT_TRACK: [
            {
              actions: ['setTrack', 'seekTo', 'playVideo'],
              cond: selectors.isEventSeekable,
            },
            {
              actions: ['setTrack', 'loadVideo'],
            },
          ],
          ...alwaysTransitions,
        },
      },
      playing: {
        on: {
          PAUSE: {
            target: 'paused',
            actions: 'pauseVideo',
          },
          YOUTUBE_PAUSE: 'paused',
          NEXT: [
            {
              target: 'requesting',
              actions: ['setNextTrack', 'seekTo'],
              cond: selectors.isNextSeekable,
            },
            {
              target: 'requesting',
              actions: ['setNextTrack', 'loadVideo'],
            },
          ],
          END: [
            // TODO: check if next track is last and reshuffle
            {
              // No other action here so that there is seamless
              // playback when going directly from one song to another
              actions: 'setNextTrack',
              cond: selectors.isNextNext,
            },
            {
              // The next track could also be in the same video for queues and shuffle
              target: 'requesting',
              actions: ['setNextTrack', 'seekTo'],
              cond: selectors.isNextSeekable,
            },
            {
              // Any other end event means it is the end of a video
              // so use loadVideo for the next one
              target: 'requesting',
              actions: ['setNextTrack', 'loadVideo'],
            },
          ],
          SELECT_TRACK: [
            {
              target: 'requesting',
              actions: ['setTrack', 'seekTo'],
              cond: selectors.isEventSeekable,
            },
            {
              target: 'requesting',
              actions: ['setTrack', 'loadVideo'],
            },
          ],
          ...alwaysTransitions,
        },
      },
      paused: {
        on: {
          PLAY: {
            target: 'requesting',
            actions: 'playVideo',
          },
          YOUTUBE_PLAY: 'playing',
          NEXT: [
            {
              actions: ['setNextTrack', 'seekTo'],
              cond: selectors.isNextSeekable,
            },
            {
              actions: ['setNextTrack', 'cueVideo'],
            },
          ],
          SELECT_TRACK: [
            {
              target: 'requesting',
              actions: ['setTrack', 'seekTo', 'playVideo'],
              cond: selectors.isEventSeekable,
            },
            {
              target: 'requesting',
              actions: ['setTrack', 'loadVideo'],
            },
          ],
          ...alwaysTransitions,
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
      setPlayer: assign<Machine.PlayerContext>({
        player: (_, event) => (event as Machine.PlayerReadyEvent).player,
      }),
      setInitialTrack: assign<Machine.PlayerContext>({
        order: (context) => ({
          ...context.order,
          selectedIndex: 0,
        }),
      }),
      setNextTrack: assign<Machine.PlayerContext>({
        order: (context) => {
          const nextIndex = selectors.getNextIndex(context)

          if (nextIndex === undefined) {
            debug.error('NEXT TRACK NOT FOUND')
          }

          return {
            ...context.order,
            selectedIndex: nextIndex ?? context.order.selectedIndex,
          }
        },
      }),
      setTrack: assign<Machine.PlayerContext>({
        order: (context, event) => {
          const selectTrackEvent = event as Machine.SelectTrackEvent
          const eventTrack = selectors.getEventTrack(context, selectTrackEvent)

          if (!eventTrack) {
            debug.error('SELECT TRACK NOT FOUND', event)
            return context.order
          }

          return trackOrder.current({
            shuffle: context.shuffle,
            repeat: context.repeat,
            selected: eventTrack,
            songOrder: context.songOrder,
            videoOrder: context.videoOrder,
            videoSongOrder: context.videoSongOrder,
          })
        },
      }),
      setTracks: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.FetchSuccessEvent

        const shuffle = event.shuffle ?? context.shuffle
        const repeat = event.repeat ?? context.repeat

        return {
          ...context,
          shuffle,
          repeat,
          ...trackOrder.initial(event.tracks, {
            selected: event.trackId
              ? ({ id: event.trackId } as Track)
              : selectors.getSelected(context),
            shuffle,
            repeat,
          }),
        }
      }),
      setTrackOrder: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.ShuffleEvent | Machine.RepeatEvent
        const selected = selectors.getSelected(context)

        const shuffle =
          event.type === 'SHUFFLE'
            ? selectors.getNextShuffle(context)
            : context.shuffle

        const repeat =
          event.type === 'REPEAT'
            ? selectors.getNextRepeat(context)
            : context.repeat

        return {
          ...context,
          shuffle,
          repeat,
          order: trackOrder.current({
            shuffle,
            repeat,
            selected,
            songOrder: context.songOrder,
            videoOrder: context.videoOrder,
            videoSongOrder: context.videoSongOrder,
          }),
        }
      }),
    },
  }
)

export default playerMachine

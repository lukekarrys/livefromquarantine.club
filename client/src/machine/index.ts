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
    actions: 'shuffleTrackOrder',
  },
}

const playerReadyTransition: Machine.PlayerTransition<Machine.PlayerReadyEvent> = {
  PLAYER_READY: [
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
      tracks: undefined,
      tracksById: undefined,
      songOrder: undefined,
      videoOrder: undefined,
      order: {
        selectedIndex: -1,
      },
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
          FETCH_START: 'loading',
          // TODO: racing the player and the loading could be done on an entry condition in ready? try that later
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      loading: {
        on: {
          FETCH_SUCCESS: [
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
          ...shuffleTransition,
        },
      },
      error: {
        on: {
          FETCH_START: 'loading',
          ...playerReadyTransition,
          ...shuffleTransition,
        },
      },
      ready: {
        // This is not ideal but the simplest way to cue the initial selected video
        // is to call this always on entry but make it a no-op in the action
        // if there is nothing selected
        entry: 'loadVideo',
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
          ...shuffleTransition,
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
          ...shuffleTransition,
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
          ...shuffleTransition,
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
      setPlayer: assign<Machine.PlayerContext>({
        player: (_, event) => (event as Machine.PlayerReadyEvent).player,
      }),
      setTracks: assign<Machine.PlayerContext>((context, event) => {
        const fetchSuccessEvent = event as Machine.FetchSuccessEvent
        const tracksContext = trackOrder.initial(fetchSuccessEvent.tracks, {
          selected: fetchSuccessEvent.trackId
            ? ({ id: fetchSuccessEvent.trackId } as Track)
            : selectors.getSelected(context),
          shuffle: context.shuffle,
        })
        return {
          ...context,
          ...tracksContext,
        }
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
            selectedIndex: nextIndex ?? context.order?.selectedIndex,
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

          const eventSongMode = eventTrack.isSong
          const newOrder =
            selectors.getCurrentSongMode(context) !== eventSongMode
              ? // If the current mode is different that the mode picked
                // in the selected track then use either song or video
                // as the new order
                eventSongMode
                ? context.songOrder
                : context.videoOrder
              : context.order

          const newIndex = newOrder?.trackIndexes?.[eventTrack.id]

          if (newIndex === undefined) {
            throw new Error(`SELECT TRACK NOT FOUND ${JSON.stringify(event)}`)
          }

          return {
            ...newOrder,
            selectedIndex: newIndex,
          }
        },
      }),
      shuffleTrackOrder: assign<Machine.PlayerContext>({
        shuffle: (context) => !context.shuffle,
        order: (context) => {
          const shuffle = !context.shuffle
          const selected = selectors.getSelected(context)

          if (shuffle && context.tracks) {
            return trackOrder.shuffle(context.tracks, selected)
          }

          const songMode = selectors.getCurrentSongMode(context)
          const newOrder = songMode ? context.songOrder : context.videoOrder

          if (!selected) {
            return {
              ...newOrder,
              selectedIndex: -1,
            }
          }

          const newIndex = newOrder?.trackIndexes?.[selected.id]

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

export default playerMachine

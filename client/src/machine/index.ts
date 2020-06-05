import { createMachine, assign } from '@xstate/fsm'
import { Repeat, SelectMode } from '../types'
import * as Machine from './types'
import * as selectors from './selectors'
import * as trackOrder from './track-order'
import * as debug from '../lib/debug'
import { pick } from '../lib/utils'

export const ytToMachineEvent: {
  [key in YT.PlayerState]: Machine.YouTubeEvent['type'] | null
} = {
  [-1]: null, // UNSTARTED, dont need to track this
  [0]: 'END_TRACK',
  [1]: 'YOUTUBE_PLAY',
  [2]: 'YOUTUBE_PAUSE',
  [3]: 'YOUTUBE_BUFFERING',
  [5]: 'YOUTUBE_CUED',
}

const readyTransitions = {
  SHUFFLE: {
    actions: 'setTrackOrder',
  },
  REPEAT: {
    actions: 'setTrackOrder',
  },
  REMOVE_TRACK: {
    actions: 'removeTrack',
  },
  REMOVE_ALL_TRACKS: {
    actions: 'removeAllTracks',
  },
  SELECT_MODE: {
    actions: 'setSelectMode',
  },
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
      actions: 'setPlayer',
    },
  ],
}

const playerErrorTransition: Machine.PlayerTransition<Machine.PlayerErrorEvent> = {
  PLAYER_ERROR: [
    {
      target: 'error',
      actions: 'setError',
    },
  ],
}

const playerTransitions = {
  ...playerReadyTransition,
  ...playerErrorTransition,
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
      currentOrder: 'order',
      order: {
        trackIndexes: {},
        trackOrder: [],
        selectedIndex: -1,
      },
      upNext: {
        trackIndexes: {},
        trackOrder: [],
        selectedIndex: -1,
      },
      error: undefined,
      player: undefined,
      shuffle: false,
      repeat: Repeat.None,
      selectMode: SelectMode.Play,
    },
    states: {
      idle: {
        on: {
          FETCH_START: 'loading',
          ...playerTransitions,
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
          ...playerTransitions,
        },
      },
      error: {
        on: {
          ...playerTransitions,
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
          NEXT_TRACK: [
            {
              target: 'requesting',
              cond: selectors.hasSelected,
              actions: ['setNextTrack', 'loadVideo'],
            },
            {
              // You can click the next button on initial state and it
              // acts the same as the play button because why not
              target: 'requesting',
              actions: ['setInitialTrack', 'loadVideo'],
            },
          ],
          SELECT_TRACK: [
            {
              actions: ['addTrack'],
              cond: selectors.eventIsUpNext,
            },
            {
              target: 'requesting',
              actions: ['setTrack', 'loadVideo'],
            },
          ],
          ...readyTransitions,
        },
      },
      requesting: {
        on: {
          YOUTUBE_BUFFERING: 'playing',
          YOUTUBE_CUED: 'playing',
          // I think youtube_play are necessary here because its
          // not perfect to tap into YouTube's event system
          // so this ensures its can't get stuck in the requesting state
          YOUTUBE_PLAY: 'playing',
          // Having youtube_pause here causes the state to go into paused when
          // switching between videos since loadVideo causes a temporary
          // pause state. removing for now to see how it works without it
          // YOUTUBE_PAUSE: "paused",
          NEXT_TRACK: [
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
              actions: ['addTrack'],
              cond: selectors.eventIsUpNext,
            },
            {
              actions: ['setTrack', 'seekTo', 'playVideo'],
              cond: selectors.isEventSeekable,
            },
            {
              actions: ['setTrack', 'loadVideo'],
            },
          ],
          ...readyTransitions,
        },
      },
      playing: {
        on: {
          PAUSE: {
            target: 'paused',
            actions: 'pauseVideo',
          },
          YOUTUBE_PAUSE: 'paused',
          NEXT_TRACK: [
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
          END_TRACK: [
            {
              // No other action here so that there is seamless
              // playback when going directly from one song to another
              actions: 'setNextTrack',
              cond: selectors.isNextNext,
            },
            {
              // The next track could also be in the same video for up next and shuffle
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
              actions: ['addTrack'],
              cond: selectors.eventIsUpNext,
            },
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
          ...readyTransitions,
        },
      },
      paused: {
        on: {
          PLAY: {
            target: 'requesting',
            actions: 'playVideo',
          },
          YOUTUBE_PLAY: 'playing',
          NEXT_TRACK: [
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
              actions: ['addTrack'],
              cond: selectors.eventIsUpNext,
            },
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
          ...readyTransitions,
        },
      },
    },
  },
  {
    actions: {
      playVideo: (context): void => context.player?.playVideo(),
      pauseVideo: (context): void => context.player?.pauseVideo(),
      cueVideo: (context): void => {
        const selected = selectors.getSelectedTrack(context)
        if (selected) {
          context.player?.cueVideoById({
            videoId: selected.videoId,
            startSeconds: selected.start,
          })
        }
      },
      loadVideo: (context): void => {
        const selected = selectors.getSelectedTrack(context)
        if (selected) {
          context.player?.loadVideoById({
            videoId: selected.videoId,
            startSeconds: selected.start,
          })
        }
      },
      seekTo: (context): void => {
        const selected = selectors.getSelectedTrack(context)
        if (selected) {
          context.player?.seekTo(selected.start, true)
        }
      },
      setError: assign<Machine.PlayerContext>({
        error: (_, event) =>
          (event as Machine.PlayerErrorEvent | Machine.FetchErrorEvent).error,
      }),
      setPlayer: assign<Machine.PlayerContext>({
        player: (_, event) => (event as Machine.PlayerReadyEvent).player,
      }),
      setTracks: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.FetchSuccessEvent

        const shuffle = event.shuffle ?? context.shuffle
        const repeat = event.repeat ?? context.repeat
        const selectMode = event.selectMode ?? context.selectMode
        const upNextIds = event.trackIds || []

        return {
          ...context,
          shuffle,
          repeat,
          selectMode,
          ...trackOrder.setInitialOrder(event.tracks, {
            shuffle,
            repeat,
            upNextIds,
          }),
        }
      }),
      setInitialTrack: assign<Machine.PlayerContext>((context) => ({
        ...context,
        [context.currentOrder]: {
          ...context[context.currentOrder],
          selectedIndex: 0,
        },
      })),
      // TODO: check if next track is last and reshuffle needs to happen
      // in set track and set next track
      // TODO: selecting a non-next song from up next should move it to now
      // but not remove the other songs before it
      // TODO: playing a song with up-next songs playing should move that
      // song to the selected up next spot which should not change the current order
      setTrack: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.SelectTrackEvent
        const eventTrack = selectors.getTrackById(context, event.trackId)
        const changeOrder = selectors.isOrderChange(context, event)

        if (!eventTrack) {
          debug.error('SET TRACK NOT FOUND', event)
          return context
        }

        if (changeOrder) {
          return {
            ...context,
            currentOrder: event.order,
            [event.order]: trackOrder.setOrder({
              selectedId: event.trackId,
              ...pick(
                context,
                'shuffle',
                'repeat',
                'songOrder',
                'videoOrder',
                'videoSongOrder',
                'tracksById'
              ),
            }),
          }
        }

        return {
          ...context,
          currentOrder: event.order,
          [event.order]: {
            ...context[event.order],
            selectedIndex: context[event.order].trackIndexes[event.orderId],
          },
        }
      }),
      setNextTrack: assign<Machine.PlayerContext>((context) => {
        const nextTrack = selectors.getNextIndex(context)

        return {
          ...context,
          currentOrder: nextTrack.currentOrder,
          // Reset upnext once finished
          upNext:
            nextTrack.currentOrder === 'order'
              ? {
                  selectedIndex: -1,
                  ...trackOrder.emptyTrackOrder(),
                }
              : context.upNext,
          [nextTrack.currentOrder]: {
            ...context[nextTrack.currentOrder],
            selectedIndex: nextTrack.selectedIndex,
          },
        }
      }),
      removeTrack: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.RemoveTrackEvent
        const order = context[event.order]
        return {
          ...context,
          [event.order]: {
            ...order,
            ...trackOrder.removeTrack(order, event.id),
          },
        }
      }),
      removeAllTracks: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.RemoveAllTracksEvent

        const orderKey = event.order
        const selected = selectors.getSelected(context)

        return {
          ...context,
          [orderKey]:
            selected && orderKey === context.currentOrder
              ? {
                  selectedIndex: 0,
                  trackIndexes: { [selected.orderId]: 0 },
                  trackOrder: [selected],
                }
              : {
                  selectedIndex: -1,
                  ...trackOrder.emptyTrackOrder(),
                },
        }
      }),
      addTrack: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.SelectTrackEvent
        const eventTrack = selectors.getTrackById(context, event.trackId)

        if (!eventTrack) {
          debug.error('ADD TRACK NOT FOUND', event)
          return context
        }

        // TODO: currently upNext is the only editable order
        // so we know its being put there, but the SELECT_TRACK
        // event will either need a new property or be separated into
        // a new event that can take target order key

        return {
          ...context,
          upNext: {
            ...context.upNext,
            ...trackOrder.addTrack(
              context.upNext,
              {
                trackId: eventTrack.id,
                orderId: trackOrder.generateOrderId(eventTrack.id),
              },
              'end'
            ),
          },
        }
      }),
      setTrackOrder: assign<Machine.PlayerContext>((context, _event) => {
        const event = _event as Machine.ShuffleEvent | Machine.RepeatEvent

        const shuffle =
          event.type === 'SHUFFLE'
            ? selectors.getNextShuffle(context)
            : context.shuffle

        const repeat =
          event.type === 'REPEAT'
            ? selectors.getNextRepeat(context)
            : context.repeat

        localStorage.setItem('repeat', repeat.toString())
        localStorage.setItem('shuffle', shuffle.toString())

        return {
          ...context,
          shuffle,
          repeat,
          order: trackOrder.setOrder({
            shuffle,
            repeat,
            selectedId: selectors.getSelectedTrack(context)?.id,
            ...pick(
              context,
              'songOrder',
              'videoOrder',
              'videoSongOrder',
              'tracksById'
            ),
          }),
        }
      }),
      setSelectMode: assign<Machine.PlayerContext>({
        selectMode: (context) => {
          const next =
            context.selectMode === SelectMode.Play
              ? SelectMode.UpNext
              : context.selectMode === SelectMode.UpNext
              ? SelectMode.Play
              : context.selectMode

          localStorage.setItem('selectMode', next.toString())

          return next
        },
      }),
    },
  }
)

export default playerMachine

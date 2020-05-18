import { FunctionalComponent, h, Fragment, ComponentChild } from 'preact'
import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import cx from 'classnames'
import { Videos as TVideos, Track, Progress } from '../types'
import YouTube from './youtube'
import Videos from './videos'
import Controls from './controls'
import * as selectors from '../machine/selectors'
import { PlayerSend, PlayerMachineState } from '../machine/types'

interface Props {
  state: PlayerMachineState
  send: PlayerSend
  children: ComponentChild
  videos?: TVideos
}

const Player: FunctionalComponent<Props> = ({
  state,
  send,
  children,
  videos = [],
}) => {
  const onSelect = useCallback(
    (track: Track) => send({ type: 'SELECT_TRACK', trackId: track.id }),
    [send]
  )

  const [progress, setProgress] = useState<Progress>({ time: 0, percent: 0 })
  const onProgress = useCallback((p: Progress): void => setProgress(p), [
    setProgress,
  ])

  const selected = selectors.getSelected(state.context)
  const isPlaying = state.matches('playing')
  const isVisuallyPlaying = isPlaying || state.matches('requesting')
  const showPlayer = !!selected

  // TODO: share urls

  useEffect(() => {
    const listener = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      else if (e.key === 'ArrowRight') send('NEXT')
      else if (e.key === ' ')
        e.preventDefault(), send(isVisuallyPlaying ? 'PAUSE' : 'PLAY')
      else if (e.key === 's') send('SHUFFLE')
    }
    document.addEventListener('keydown', listener)
    return (): void => document.removeEventListener('keydown', listener)
  }, [send, isVisuallyPlaying])

  const playerContainer = useRef<HTMLDivElement>()

  return (
    <Fragment>
      <div class="sticky top-0" ref={playerContainer}>
        <div
          class={cx('shadow-inner', showPlayer ? 'bg-black' : 'bg-gray-200')}
        >
          <div class="mx-auto max-w-0 sm-h:max-w-video-16/9-60vh md-h:max-w-screen-c">
            <YouTube
              show={showPlayer}
              selected={selected}
              play={state.matches('playing')}
              send={send}
              onProgress={onProgress}
            >
              <div class="bg-gray-200 w-full h-full flex justify-center items-center flex-col">
                {children}
              </div>
            </YouTube>
          </div>
        </div>
        <div class="bg-white border-b border-t border-gray-600 shadow-sm">
          <Controls
            selected={selected}
            progress={progress}
            play={state.matches('playing') || state.matches('requesting')}
            shuffle={state.context.shuffle}
            send={send}
          />
        </div>
      </div>
      <div>
        <Videos
          videos={videos}
          selected={selected}
          onSelect={onSelect}
          playerRef={playerContainer}
        />
      </div>
    </Fragment>
  )
}

export default Player

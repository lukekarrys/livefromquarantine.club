import { FunctionalComponent, h, Fragment, ComponentChild } from 'preact'
import { useState, useCallback, useEffect, useRef } from 'preact/hooks'
import cx from 'classnames'
import { Videos as TVideos, Progress } from '../types'
import YouTube from './youtube'
import Videos from './videos'
import Controls from './controls'
import UpNext from './upnext'
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
  const [scrollTo, setScrollTo] = useState(false)
  const [progress, setProgress] = useState<Progress>({ time: 0, percent: 0 })
  const onProgress = useCallback((p: Progress): void => setProgress(p), [
    setProgress,
  ])

  const selected = selectors.getSelected(state.context)
  const isPlaying = state.matches('playing')
  const isVisuallyPlaying = isPlaying || state.matches('requesting')
  const isReady = selectors.isReady(state)
  const showPlayer = !!selected

  // TODO: share urls

  useEffect(() => {
    const listener = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      else if (e.key === 'ArrowRight') send('NEXT_TRACK')
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
      <div class="sticky top-0 z-10" ref={playerContainer}>
        <div class={cx(showPlayer ? 'bg-black' : 'shadow-inner bg-gray-200')}>
          <div class="mx-auto max-w-0 sm-h:max-w-video-16/9-60vh md-h:max-w-screen-c">
            <YouTube
              show={showPlayer}
              selected={selected}
              play={state.matches('playing')}
              send={send}
              onProgress={onProgress}
            >
              <div class="w-full h-full flex justify-center items-center flex-col">
                {children}
              </div>
            </YouTube>
          </div>
        </div>
        <div class="bg-white border-b border-t border-gray-600 shadow-sm">
          <Controls
            ready={isReady}
            selected={selected}
            progress={progress}
            play={isVisuallyPlaying}
            shuffle={state.context.shuffle}
            repeat={state.context.repeat}
            send={send}
            onTitleClick={(): void => setScrollTo((s) => !s)}
          />
        </div>
      </div>
      <div>
        <Videos
          ready={isReady}
          videos={videos}
          selected={selected}
          send={send}
          playerRef={playerContainer}
          scrollTo={scrollTo}
        />
      </div>
      <UpNext
        send={send}
        selected={selected}
        upNext={state.context.upNext}
        order={state.context.order}
        tracks={state.context.tracksById}
      />
    </Fragment>
  )
}

export default Player

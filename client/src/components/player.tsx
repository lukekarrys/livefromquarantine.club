import { FunctionalComponent, h, Fragment, ComponentChild } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import cx from 'classnames'
import { Videos as TVideos } from '../types'
import YouTube from './youtube'
import Audio from './audio'
import Videos from './videos'
import Controls from './controls'
import UpNext from './upnext'
import * as selectors from '../machine/selectors'
import { PlayerSend, PlayerMachineState } from '../machine/types'
import * as url from '../lib/url'

interface Props {
  state: PlayerMachineState
  send: PlayerSend
  children: ComponentChild
  media?: string
  videos?: TVideos
}

type KeyMod = 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'
const mods: KeyMod[] = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']

const Player: FunctionalComponent<Props> = ({
  state,
  send,
  children,
  media = 'youtube',
  videos = [],
}) => {
  const [scrollTo, setScrollTo] = useState(false)
  const selected = selectors.getSelectedTrack(state.context)
  const isPlaying = state.matches('playing')
  const isVisuallyPlaying = isPlaying || state.matches('requesting')
  const isReady = selectors.isReady(state)
  const showPlayer = !!selected

  useEffect(() => {
    const listener = (e: KeyboardEvent): void => {
      const noMod = mods.every((mod) => e[mod] === false)
      const onlyMod = (mod: KeyMod) =>
        mods.every((m) => {
          const shouldBe = mod === m ? true : false
          return e[m] === shouldBe
        })

      if (noMod && e.key === 'ArrowRight') send('NEXT_TRACK')
      else if (noMod && e.key === ' ')
        e.preventDefault(), send(isVisuallyPlaying ? 'PAUSE' : 'PLAY')
      else if (noMod && e.key === 's') send('SHUFFLE')
      else if (noMod && e.key === 'r') send('REPEAT')
      else if (noMod && e.key === 'u') send('SELECT_MODE')
      else if (onlyMod('ctrlKey') && e.key === 'm') {
        window.location.href = url.url(window.location.href, {
          media: media === 'youtube' ? 'audio' : 'youtube',
        })
      }
    }
    document.addEventListener('keydown', listener)
    return (): void => document.removeEventListener('keydown', listener)
  }, [send, isVisuallyPlaying, media])

  const playerContainer = useRef<HTMLDivElement>()

  return (
    <Fragment>
      <div class="sticky top-0 z-10" ref={playerContainer}>
        {media === 'youtube' ? (
          <div class={cx(showPlayer ? 'bg-black' : 'shadow-inner bg-gray-200')}>
            <div class="mx-auto max-w-video-16/9-40vh sm-h:max-w-video-16/9-50vh md-h:max-w-screen-c">
              <YouTube
                show={showPlayer}
                selected={selected}
                play={isPlaying}
                send={send}
              >
                <div class="w-full h-full flex justify-center items-center flex-col">
                  <div class="overflow-y-scroll">{children}</div>
                </div>
              </YouTube>
            </div>
          </div>
        ) : media === 'audio' ? (
          <Audio send={send} selected={selected} play={isPlaying} />
        ) : null}
        <div class="bg-white border-b border-t border-gray-600 shadow">
          <Controls
            ready={isReady}
            selected={selected}
            player={state.context.player}
            play={isVisuallyPlaying}
            shuffle={state.context.shuffle}
            repeat={state.context.repeat}
            selectMode={state.context.selectMode}
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

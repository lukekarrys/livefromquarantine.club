/// <reference types="@types/youtube" />
import { FunctionalComponent, h, ComponentChild } from 'preact'
import { useEffect, useRef, useMemo, useLayoutEffect } from 'preact/hooks'
import cx from 'classnames'
import { PlayerSend } from '../machine/types'
import { Track, Progress } from '../types'
import useYouTube from '../lib/useYouTube'

interface Props {
  selected?: Track
  play?: boolean
  send: PlayerSend
  onProgress?: ({ time, percent }: Progress) => void
  children?: ComponentChild
  show?: boolean
}

const YouTube: FunctionalComponent<Props> = ({
  selected,
  play,
  send,
  onProgress,
  children,
  show,
}) => {
  const domRef = useRef<HTMLDivElement>(null)
  const player = useYouTube(
    domRef,
    useMemo(
      () => ({
        onReady: (player): void => send({ type: 'PLAYER_READY', player }),
        onError: (error): void => send({ type: 'PLAYER_ERROR', error }),
        onStateChange: (event): void => send({ type: event }),
      }),
      [send]
    )
  )

  useEffect(() => {
    if (!player || !selected || !play || !onProgress) return

    const interval: NodeJS.Timeout = setInterval(() => {
      if (!player || !selected || !play || !onProgress) {
        return clearInterval(interval)
      }

      const { start, end } = selected
      const current = player.getCurrentTime()
      const time = current - start

      if (!time || time <= 0) {
        onProgress({ time: 0, percent: 0 })
      } else {
        onProgress({
          time,
          percent: (time / (end - start)) * 100,
        })
      }
    }, 1000 / 60)

    return (): void => clearInterval(interval)
  }, [player, selected, play, onProgress])

  useEffect(() => {
    if (!player || !selected || !play) return

    const interval: NodeJS.Timeout = setInterval(() => {
      if (!player || !selected || !play) {
        return clearInterval(interval)
      }

      if (player.getCurrentTime() >= selected.end) {
        clearInterval(interval)
        send('END_TRACK')
      }
    }, 1000)

    return (): void => clearInterval(interval)
  }, [player, selected, play, send])

  useLayoutEffect(() => {
    if (player) {
      // The initial state of video player is hidden by the show prop but that
      // class is copied from the original dom node and put on the youtube player
      // so this effect is necessary to remove it after that
      player.getIframe().classList[show ? 'remove' : 'add']('hidden')
    }
  }, [show, player])

  return (
    <div class="video-16/9-container">
      <div class={cx('video-16/9', show && 'hidden')}>{children}</div>
      <div ref={domRef} class={cx('video-16/9', !show && 'hidden')} />
    </div>
  )
}

export default YouTube

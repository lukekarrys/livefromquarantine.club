/// <reference types="@types/youtube" />
import { FunctionalComponent, h, ComponentChild } from 'preact'
import { useEffect, useRef, useCallback } from 'preact/hooks'
import cx from 'classnames'
import { PlayerSend } from '../machine/types'
import { ytToMachineEvent } from '../machine'
import { Track, Progress } from '../types'
import useYouTube from '../lib/useYouTube'
import * as debug from '../lib/debug'

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
    useCallback((player) => send({ type: 'PLAYER_READY', player }), [send]),
    useCallback(
      (e: YT.OnStateChangeEvent): void => {
        const sendEvent = ytToMachineEvent[e.data]
        if (sendEvent) {
          debug.log('YOUTUBE_EVENT', sendEvent)
          send(sendEvent)
        }
      },
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
        send('END')
      }
    }, 1000)

    return (): void => clearInterval(interval)
  }, [player, selected, play, send])

  return (
    <div class="video-16/9-container">
      <div class={cx('video-16/9 z-10', show && 'hidden')}>{children}</div>
      <div ref={domRef} class="video-16/9" />
    </div>
  )
}

export default YouTube

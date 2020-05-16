/// <reference types="@types/youtube" />
import { FunctionalComponent, h, ComponentChild } from "preact"
import { useEffect, useRef, useCallback } from "preact/hooks"
import cx from "classnames"
import { PlayerMachineSend, ytToMachineEvent } from "../machine"
import { Track } from "../types"
import useYouTube from "../lib/useYouTube"
import * as debug from "../lib/debug"

interface Props {
  selected?: Track
  play?: boolean
  send: PlayerMachineSend
  onProgress?: ({ time, percent }: { time: number; percent: number }) => void
  children?: ComponentChild
}

const YouTube: FunctionalComponent<Props> = ({
  selected,
  play,
  send,
  onProgress,
  children,
}) => {
  const domRef = useRef<HTMLDivElement>(null)
  const player = useYouTube(
    domRef,
    useCallback((player) => send({ type: "PLAYER_READY", player }), [send]),
    useCallback(
      (e: YT.OnStateChangeEvent): void => {
        const sendEvent = ytToMachineEvent[e.data]
        if (sendEvent) {
          debug.log("YOUTUBE_EVENT", sendEvent)
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
        send("END")
      }
    }, 1000)

    return (): void => clearInterval(interval)
  }, [player, selected, play, send])

  return (
    <div class="relative h-0 overflow-hidden max-w-full pb-video">
      <div
        class={cx(
          "absolute top-0 left-0 w-full h-full z-10",
          selected && "hidden"
        )}
      >
        {children}
      </div>
      <div ref={domRef} class="absolute top-0 left-0 w-full h-full" />
    </div>
  )
}

export default YouTube

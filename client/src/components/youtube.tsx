import { FunctionalComponent, h, VNode } from "preact"
import { useEffect, useRef, useMemo } from "preact/hooks"
import cx from "classnames"
import { Sender } from "../lib/player-machine"
import { Track } from "../types"
import useYouTube from "../lib/useYouTube"

const isTrackEqual = (current?: Track, previous?: Track): boolean => {
  return (
    !!current &&
    !!previous &&
    current.videoId === previous.videoId &&
    current.start === previous.start &&
    current.end === previous.end
  )
}

const isSeekable = (current?: Track, previous?: Track): boolean => {
  return (
    !!current &&
    !!previous &&
    current.videoId === previous.videoId &&
    (current.start !== previous.start || current.end !== previous.end)
  )
}

const isNextTrack = (current?: Track, previous?: Track): boolean => {
  return (
    !!current &&
    !!previous &&
    current.videoId === previous.videoId &&
    current.start === previous.end
  )
}

interface Props {
  selected?: Track
  play?: boolean
  send: Sender
  onProgress?: ({ time, percent }: { time: number; percent: number }) => void
  splash?: VNode
}

const YouTube: FunctionalComponent<Props> = ({
  selected,
  play,
  send,
  onProgress,
  splash,
}) => {
  const playRef = useRef(play)
  const selectedRef = useRef(selected)
  const domRef = useRef<HTMLDivElement>(null)
  const player = useYouTube(
    domRef,
    useMemo(
      () => ({
        events: {
          onReady: (): void => send("READY"),
          onStateChange: (e: YT.OnStateChangeEvent): void => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              send("YOUTUBE_PLAY")
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              send("YOUTUBE_PAUSE")
            } else if (e.data === window.YT.PlayerState.BUFFERING) {
              send("YOUTUBE_BUFFERING")
            } else if (e.data === window.YT.PlayerState.CUED) {
              send("YOUTUBE_CUED")
            }
          },
        },
      }),
      [send]
    )
  )

  useEffect(() => {
    const interval: NodeJS.Timeout = setInterval(() => {
      if (!player || !selected || !play) {
        return clearInterval(interval)
      }

      const { start, end } = selected
      const current = player.getCurrentTime()
      const time = current - start

      if (onProgress) {
        if (!time || time <= 0) {
          onProgress({ time: 0, percent: 0 })
        } else {
          onProgress({
            time,
            percent: (time / (end - start)) * 100,
          })
        }
      }

      if (current >= end) {
        clearInterval(interval)
        send("END")
      }
    }, 1000 / 60)
    return (): void => clearInterval(interval)
  }, [selected, play, onProgress, player, send])

  useEffect(() => {
    if (!player) return

    const sameTrack = isTrackEqual(selected, selectedRef.current)

    if (play !== playRef.current && sameTrack) {
      player[play ? "playVideo" : "pauseVideo"]()
    } else if (selected) {
      if (play) {
        if (
          isNextTrack(selected, selectedRef.current) &&
          player.getCurrentTime() >= selected.start
        ) {
          send("YOUTUBE_CUED")
        } else if (isSeekable(selected, selectedRef.current)) {
          player.seekTo(selected.start, true)
        } else {
          player.loadVideoById({
            videoId: selected.videoId,
            startSeconds: selected.start,
          })
        }
      } else {
        player.cueVideoById({
          videoId: selected.videoId,
          startSeconds: selected.start,
        })
      }
    }

    playRef.current = play
    selectedRef.current = selected
  }, [selected, play, player, send])

  return (
    <div class="relative h-0 overflow-hidden max-w-full pb-video">
      <div
        class={cx(
          "absolute top-0 left-0 w-full h-full z-10",
          selected && "hidden"
        )}
      >
        {splash}
      </div>
      <div ref={domRef} class="absolute top-0 left-0 w-full h-full" />
    </div>
  )
}

export default YouTube

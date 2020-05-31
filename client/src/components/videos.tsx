import { FunctionalComponent, h, RefObject } from 'preact'
import cx from 'classnames'
import { useEffect } from 'preact/hooks'
import { Videos as TVideos, Track, VideoId, TrackId } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'
import { PlayerSend } from '../machine/types'

interface Props {
  ready: boolean
  videos: TVideos
  send: PlayerSend
  selected?: Track
  playerRef: RefObject<HTMLDivElement>
  scrollTo: boolean
}

type ButtonProps = Pick<Props, 'send' | 'selected' | 'ready'> & {
  track: Track
  last: boolean
}

const BUTTON_ID = (id: TrackId): string => `video-track-${id}`
const VIDEO_ID = (id: VideoId): string => `video-tracks-${id}`

const avg = (nums: number[]): number => (nums[0] + nums[1]) / 2

const TrackButton: FunctionalComponent<ButtonProps> = ({
  ready,
  track,
  selected,
  send,
  last,
}) => {
  const title = Array.isArray(track.title) ? track.title[1] : 'Play All'
  return (
    <div
      class={cx(
        'mb-2',
        'w-full sm:w-1/2 md:w-auto',
        'px-1',
        last ? 'md:flex-grow-0' : 'md:flex-grow'
      )}
    >
      <Button
        id={BUTTON_ID(track.id)}
        onClick={(): void =>
          send({ type: 'SELECT_TRACK', order: 'order', id: track.id })
        }
        selected={selected?.id === track.id}
        class={cx('w-full flex justify-between sm:justify-center items-center')}
        title={title}
        tight={false}
        disabled={!ready}
      >
        <span class="truncate">{title}</span>
        <span class="ml-1 text-sm italic tabular-nums">
          ({hhmmss(track.end - track.start)})
        </span>
      </Button>
    </div>
  )
}

const Videos: FunctionalComponent<Props> = ({
  ready,
  videos,
  selected,
  send,
  playerRef,
  scrollTo,
}) => {
  useEffect(() => {
    if (!selected) return

    const video = document.getElementById(VIDEO_ID(selected.videoId))
    const trackButton = document.getElementById(BUTTON_ID(selected.id))
    const player = playerRef.current
    const scrollContainer = document.documentElement

    if (!video || !trackButton || !scroll || !player) return

    const videoRect = video.getBoundingClientRect()
    const trackButtonRect = trackButton.getBoundingClientRect()
    const playerHeight = player.getBoundingClientRect().height

    const videoBounds = [video.offsetTop, video.offsetTop + videoRect.height]
    const buttonBounds = [
      trackButton.offsetTop,
      trackButton.offsetTop + trackButtonRect.height,
    ]
    const buttonInsideVideoBounds = buttonBounds.map((v) => v - video.offsetTop)
    const viewportBounds = [playerHeight, window.innerHeight].map(
      (i) => i + scrollContainer.scrollTop
    )
    const viewportHeight = viewportBounds[1] - viewportBounds[0]

    if (
      avg(buttonBounds) < viewportBounds[0] ||
      avg(buttonBounds) > viewportBounds[1]
    ) {
      if (avg(buttonInsideVideoBounds) > viewportHeight) {
        // Scroll so bottom of video is the bottom of the viewport
        scrollContainer.scrollTop =
          videoBounds[1] - playerHeight - viewportHeight
      } else {
        // Scroll so top of the video is top of the viewport
        scrollContainer.scrollTop = videoBounds[0] - playerHeight + 2
      }
    }
  }, [selected, playerRef, scrollTo])

  return (
    <div class="overflow-hidden">
      {videos.map((video) => (
        <div
          id={VIDEO_ID(video.id)}
          key={video.id}
          class={
            'pt-2 md:pt-4 pb-2 px-2 border-b border-gray-600 flex flex-row flex-wrap -mx-1'
          }
        >
          <h2 class="text-xl md:mx-1 mb-2 text-center w-full md:w-auto">
            {video.title}
          </h2>
          {video.tracks.map((track, index, list) => (
            <TrackButton
              ready={ready}
              key={track.id}
              track={track}
              selected={selected}
              send={send}
              last={index === list.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Videos

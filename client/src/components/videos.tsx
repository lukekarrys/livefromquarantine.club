import { FunctionalComponent, h, RefObject } from 'preact'
import cx from 'classnames'
import { useEffect } from 'preact/hooks'
import { Videos as TVideos, Track, VideoId, TrackId } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'

interface Props {
  videos: TVideos
  onSelect: (track: Track) => void
  selected?: Track
  playerRef: RefObject<HTMLDivElement>
}

type ButtonProps = Omit<Props, 'videos' | 'playerRef'> & {
  track: Track
  last: boolean
}

const BUTTON_ID = (id: TrackId): string => `video-track-${id}`
const VIDEO_ID = (id: VideoId): string => `video-tracks-${id}`

const TrackButton: FunctionalComponent<ButtonProps> = ({
  track,
  selected,
  onSelect,
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
        onClick={(): void => onSelect(track)}
        selected={selected?.id === track.id}
        class={cx('w-full flex justify-between sm:justify-center items-center')}
        title={title}
        tight={false}
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
  videos,
  selected,
  onSelect,
  playerRef,
}) => {
  useEffect(() => {
    if (!selected) return

    const video = document.getElementById(VIDEO_ID(selected.videoId))
    const trackButton = document.getElementById(BUTTON_ID(selected.id))
    const player = playerRef.current
    const scrollContainer = document.documentElement

    if (!video || !trackButton || !scroll || !player) return

    const playerHeight = player.getBoundingClientRect().height

    const buttonBounds = [
      trackButton.offsetTop,
      trackButton.offsetTop + trackButton.getBoundingClientRect().height,
    ]

    const viewport = [playerHeight, window.innerHeight].map(
      (i) => i + scrollContainer.scrollTop
    )

    if (buttonBounds[0] < viewport[0] || buttonBounds[1] > viewport[1]) {
      scrollContainer.scrollTop = video.offsetTop - playerHeight + 2
    }
  }, [selected, playerRef])

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
              key={track.id}
              track={track}
              selected={selected}
              onSelect={onSelect}
              last={index === list.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Videos

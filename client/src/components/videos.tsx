import { FunctionalComponent, h, Fragment, RefObject } from "preact"
import cx from "classnames"
import { useEffect } from "preact/hooks"
import { Videos as TVideos, Track, VideoId, TrackId } from "../types"
import Button from "./button"
import hhmmss from "../lib/hhmmss"

interface Props {
  videos: TVideos
  onSelect: (track: Track) => void
  selected?: Track
  playerRef: RefObject<HTMLDivElement>
}

type ButtonProps = Omit<Props, "videos" | "playerRef"> & {
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
  const title = Array.isArray(track.title) ? track.title[1] : "Play All"
  return (
    <Button
      id={BUTTON_ID(track.id)}
      onClick={(): void => onSelect(track)}
      selected={selected?.id === track.id}
      class={cx(
        "w-full md:w-auto mb-2 md:mr-2 truncate",
        last ? "flex-grow-0" : "flex-grow"
      )}
      title={title}
    >
      {title} ({hhmmss(track.end - track.start)})
    </Button>
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
    <Fragment>
      {videos.map((video) => (
        <div
          id={VIDEO_ID(video.id)}
          key={video.id}
          class={cx(
            "py-4 border-b px-2 border-gray-600 flex flex-row flex-wrap"
          )}
        >
          <h2 class="text-xl md:mr-2 text-center w-full md:w-auto">
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
    </Fragment>
  )
}

export default Videos

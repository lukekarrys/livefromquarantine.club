import { FunctionalComponent, h, Fragment } from "preact"
import cx from "classnames"
import { useEffect } from "preact/hooks"
import { Videos as TVideos, Track } from "../types"
import Button from "./button"
import hhmmss from "../lib/hhmmss"

interface Props {
  videos: TVideos
  onSelect: (track: Track) => void
  selected?: Track
}

type ButtonProps = Omit<Props, "videos"> & {
  track: Track
  last: boolean
}

const TrackButton: FunctionalComponent<ButtonProps> = ({
  track,
  selected,
  onSelect,
  last,
}) => {
  const title = Array.isArray(track.title) ? track.title[1] : "Play All"
  return (
    <Button
      id={`track-button-${track.id}`}
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

const Videos: FunctionalComponent<Props> = ({ videos, selected, onSelect }) => {
  useEffect(() => {
    // TODO: fix scroll to
    // const $button = document.getElementById(`track-button-${selected?.id}`)
    // if ($button) {
    //   const $songs = document.documentElement
    //   const buttonTop = $button.offsetTop - $songs.offsetTop - $songs.scrollTop
    //   const buttonBottom = $button.getBoundingClientRect().height + buttonTop
    //   if (buttonTop < 0 || buttonBottom > window.innerHeight) {
    //     $songs.scrollTop = buttonTop - 475
    //   }
    // }
  }, [selected?.id])

  return (
    <Fragment>
      {videos.map((video) => (
        <div
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

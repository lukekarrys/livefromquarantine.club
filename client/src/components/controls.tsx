import { FunctionalComponent, h } from "preact"
import { Sender } from "../lib/player-machine"
import { Progress, Track } from "../types"
import Button from "./button"
import hhmmss from "../lib/hhmmss"

interface Props {
  selected?: Track
  play: boolean
  progress: Progress
  send: Sender
}

const Controls: FunctionalComponent<Props> = ({
  selected,
  play,
  progress,
  send,
}) => {
  const title = Array.isArray(selected?.title)
    ? selected?.title.join(" - ")
    : selected?.title
  return (
    <div class="px-2 py-1 relative overflow-hidden">
      <div
        class="absolute h-full w-full left-0 top-0 bg-gray-400"
        style={{ left: "-100%", transform: `translate(${progress.percent}%)` }}
      />
      <div class="relative flex items-center">
        {play ? (
          <Button onClick={(): void => send("PAUSE")} selected>
            pause
          </Button>
        ) : (
          <Button onClick={(): void => send("PLAY")}>play</Button>
        )}
        <Button class="ml-1" onClick={(): void => send("NEXT")}>
          next
        </Button>
        <span class="ml-1" style={{ fontVariantNumeric: "tabular-nums" }}>
          {hhmmss(progress.time)}

          {selected && `/${hhmmss(selected.duration)}`}
        </span>
        <span class="truncate ml-1">{title}</span>
      </div>
    </div>
  )
}

export default Controls

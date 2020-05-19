import { FunctionalComponent, h } from 'preact'
import { PlayerSend } from '../machine/types'
import { Progress, Track } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'
import ShuffleIcon from '../icons/shuffle'
import PauseIcon from '../icons/pause'
import PlayIcon from '../icons/play'
import NextIcon from '../icons/next'

interface Props {
  selected?: Track
  play?: boolean
  shuffle?: boolean
  progress: Progress
  send: PlayerSend
}

const Controls: FunctionalComponent<Props> = ({
  selected,
  play,
  progress,
  send,
  shuffle,
}) => {
  const title = Array.isArray(selected?.title)
    ? selected?.title.join(' - ')
    : selected?.title
  return (
    <div class="px-2 py-1 relative overflow-hidden">
      <div
        class="absolute h-full w-full left-0 top-0 bg-gray-400 shadow-inner border-r border-gray-600"
        style={{
          left: '-100%',
          transform: `translate(${progress.percent || 0}%)`,
        }}
      />
      <div class="relative flex items-center">
        <Button
          onClick={(): void => send('SHUFFLE')}
          selected={shuffle}
          tight={false}
        >
          <ShuffleIcon height={18} />
        </Button>
        {play ? (
          <Button
            class="ml-1"
            tight={false}
            onClick={(): void => send('PAUSE')}
            selected
          >
            <PauseIcon height={18} />
          </Button>
        ) : (
          <Button class="ml-1" tight={false} onClick={(): void => send('PLAY')}>
            <PlayIcon height={18} />
          </Button>
        )}
        <Button class="ml-1" tight={false} onClick={(): void => send('NEXT')}>
          <NextIcon height={18} />
        </Button>
        <span class="truncate ml-1">{title}</span>
        {progress && (
          <span class="ml-auto tabular-nums text-sm italic">
            {`${hhmmss(progress.time)}${
              selected ? `/${hhmmss(selected.duration)}` : ''
            }`}
          </span>
        )}
      </div>
    </div>
  )
}

export default Controls

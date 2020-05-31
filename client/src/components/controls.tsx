import { FunctionalComponent, h } from 'preact'
import cx from 'classnames'
import { PlayerSend } from '../machine/types'
import { Progress, Track, Repeat } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'
import ShuffleIcon from '../icons/shuffle'
import PauseIcon from '../icons/pause'
import PlayIcon from '../icons/play'
import NextIcon from '../icons/next'
import RepeatIcon from '../icons/repeat'

interface Props {
  ready: boolean
  selected?: Track
  play: boolean
  shuffle: boolean
  repeat: Repeat
  progress: Progress
  send: PlayerSend
  onTitleClick: () => void
}

const Controls: FunctionalComponent<Props> = ({
  ready,
  selected,
  play,
  progress,
  send,
  shuffle,
  repeat,
  onTitleClick,
}) => {
  const isRepeat = repeat === Repeat.Song || repeat === Repeat.Video
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
          disabled={!ready}
        >
          <ShuffleIcon height={18} />
        </Button>
        <Button
          onClick={(): void => send('REPEAT')}
          selected={isRepeat}
          tight={false}
          class="ml-1 flex items-center"
          disabled={!ready}
        >
          <RepeatIcon height={18} />
          <span
            style={{ height: '18px', lineHeight: '18px' }}
            class={cx('text-xl font-bold', isRepeat && 'ml-1')}
          >
            {repeat === Repeat.Song
              ? 'S'
              : repeat === Repeat.Video
              ? 'V'
              : null}
          </span>
        </Button>
        {play ? (
          <Button
            class="ml-1"
            tight={false}
            onClick={(): void => send('PAUSE')}
            selected
            disabled={!ready}
          >
            <PauseIcon height={18} />
          </Button>
        ) : (
          <Button
            class="ml-1"
            tight={false}
            onClick={(): void => send('PLAY')}
            disabled={!ready}
          >
            <PlayIcon height={18} />
          </Button>
        )}
        <Button
          class="ml-1"
          tight={false}
          onClick={(): void => send('NEXT_TRACK')}
          disabled={!ready}
        >
          <NextIcon height={18} />
        </Button>
        <button class="truncate ml-1" onClick={onTitleClick} disabled={!ready}>
          {title}
        </button>
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

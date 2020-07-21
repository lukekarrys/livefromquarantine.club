import { FunctionalComponent, h } from 'preact'
import cx from 'classnames'
import { useState, useEffect } from 'preact/hooks'
import { PlayerSend } from '../machine/types'
import { Track, Repeat, SelectMode } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'
import ShuffleIcon from '../icons/shuffle'
import PauseIcon from '../icons/pause'
import PlayIcon from '../icons/play'
import NextIcon from '../icons/next'
import RepeatIcon from '../icons/repeat'
import { toSongAndVideoTitle } from '../lib/to-title'
import ListIcon from '../icons/list'

interface Props {
  ready: boolean
  selected?: Track
  play: boolean
  shuffle: boolean
  repeat: Repeat
  player?: YT.Player
  selectMode: SelectMode
  send: PlayerSend
  onTitleClick: () => void
}

const Controls: FunctionalComponent<Props> = ({
  ready,
  selected,
  play,
  player,
  send,
  shuffle,
  repeat,
  selectMode,
  onTitleClick,
}) => {
  const [progress, setProgress] = useState({ time: 0, percent: 0 })

  useEffect(() => {
    if (!player || !selected || !play) return

    const interval: NodeJS.Timeout = setInterval(() => {
      if (!player || !selected || !play) {
        return clearInterval(interval)
      }

      const { start, end } = selected
      const current = player.getCurrentTime()
      const time = current - start

      if (!time || time <= 0) {
        setProgress({ time: 0, percent: 0 })
      } else {
        setProgress({
          time,
          percent: (time / (end - start)) * 100,
        })
      }
    }, 1000 / 60)

    return (): void => clearInterval(interval)
  }, [player, selected, play])

  const isRepeat = repeat === Repeat.Song || repeat === Repeat.Video
  const title = toSongAndVideoTitle(selected)

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
          onClick={(): void => send('SELECT_MODE')}
          selected={selectMode === SelectMode.UpNext}
          tight={false}
          disabled={!ready}
          title={`Up Next - ${selectMode === SelectMode.UpNext ? 'On' : 'Off'}`}
        >
          <ListIcon height={18} />
        </Button>
        <Button
          onClick={(): void => send('SHUFFLE')}
          selected={shuffle}
          tight={false}
          disabled={!ready}
          class="ml-1"
          title={`Shuffle - ${shuffle ? 'On' : 'Off'}`}
        >
          <ShuffleIcon height={18} />
        </Button>
        <Button
          onClick={(): void => send('REPEAT')}
          selected={isRepeat}
          tight={false}
          class="ml-1 relative"
          disabled={!ready}
          title={`Repeat - ${
            repeat === Repeat.Song
              ? 'Song'
              : repeat === Repeat.Video
              ? 'Video'
              : 'All'
          }`}
        >
          <RepeatIcon height={18} />
          <span
            style={{ height: '12px', lineHeight: '12px', right: 2, bottom: 2 }}
            class={cx('text-sm font-bold absolute')}
          >
            {repeat === Repeat.Song
              ? 'S'
              : repeat === Repeat.Video
              ? 'V'
              : null}
          </span>
        </Button>
        <Button
          class="ml-1"
          tight={false}
          onClick={(): void => (play ? send('PAUSE') : send('PLAY'))}
          selected={play}
          disabled={!ready}
          title={play ? 'Pause' : 'Play'}
        >
          {play ? <PauseIcon height={18} /> : <PlayIcon height={18} />}
        </Button>
        <Button
          class="ml-1"
          tight={false}
          onClick={(): void => send('NEXT_TRACK')}
          disabled={!ready}
          title="Next Track"
        >
          <NextIcon height={18} />
        </Button>
        <button
          class="truncate ml-1"
          onClick={onTitleClick}
          disabled={!ready}
          title={title}
        >
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

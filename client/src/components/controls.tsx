import { FunctionalComponent, h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { PlayerSend } from '../machine/types'
import { Track, Repeat, SelectMode, MediaMode } from '../types'
import Button from './button'
import hhmmss from '../lib/hhmmss'
import PauseIcon from '../icons/pause'
import PlayIcon from '../icons/play'
import NextIcon from '../icons/next'
import { toSongAndVideoTitle } from '../lib/to-title'
import MediaPlayer from '../lib/MediaPlayer'
import ModeControls from './mode-controls'

interface Props {
  ready: boolean
  selected?: Track
  play: boolean
  shuffle: boolean
  repeat: Repeat
  player?: MediaPlayer
  selectMode: SelectMode
  mediaMode: MediaMode
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
  mediaMode,
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
        <div class="hidden sm:block">
          <ModeControls
            ready={ready}
            send={send}
            shuffle={shuffle}
            selectMode={selectMode}
            mediaMode={mediaMode}
            repeat={repeat}
          />
        </div>
        <div>
          <Button
            class="ml-1 first:ml-0"
            tight={false}
            onClick={(): void => (play ? send('PAUSE') : send('PLAY'))}
            selected={play}
            disabled={!ready}
            title={play ? 'Pause' : 'Play'}
          >
            {play ? <PauseIcon height={18} /> : <PlayIcon height={18} />}
          </Button>
          <Button
            class="ml-1 first:ml-0"
            tight={false}
            onClick={(): void => send('NEXT_TRACK')}
            disabled={!ready}
            title="Next Track"
          >
            <NextIcon height={18} />
          </Button>
        </div>
        <button
          class="truncate pl-1 pr-1 rounded focus:outline-none focus:shadow-outline"
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

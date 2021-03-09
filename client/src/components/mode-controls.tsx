import { Fragment, FunctionalComponent, h } from 'preact'
import cx from 'classnames'
import { PlayerSend } from '../machine/types'
import { Repeat, SelectMode, MediaMode } from '../types'
import Button from './button'
import ShuffleIcon from '../icons/shuffle'
import RepeatIcon from '../icons/repeat'
import ListIcon from '../icons/list'
import AudioIcon from '../icons/audio'
import VideoIcon from '../icons/video'

interface Props {
  ready: boolean
  shuffle: boolean
  repeat: Repeat
  selectMode: SelectMode
  mediaMode: MediaMode
  send: PlayerSend
}

const Controls: FunctionalComponent<Props> = ({
  ready,
  send,
  shuffle,
  repeat,
  selectMode,
  mediaMode,
}) => {
  const isRepeat = repeat === Repeat.Song || repeat === Repeat.Video
  const classes = 'ml-1 first:ml-0'

  return (
    <Fragment>
      {mediaMode !== MediaMode.YouTubeOnly && (
        <Button
          onClick={(): void => send('SELECT_MEDIA_MODE')}
          tight={false}
          disabled={!ready}
          title={`Media - ${
            mediaMode === MediaMode.Audio ? 'Audio' : 'YouTube'
          }`}
          class={classes}
        >
          {mediaMode === MediaMode.Audio ? (
            <VideoIcon height={18} />
          ) : (
            <AudioIcon height={18} />
          )}
        </Button>
      )}
      <Button
        onClick={(): void => send('SELECT_MODE')}
        selected={selectMode === SelectMode.UpNext}
        tight={false}
        disabled={!ready}
        class={classes}
        title={`Up Next - ${selectMode === SelectMode.UpNext ? 'On' : 'Off'}`}
      >
        <ListIcon height={18} />
      </Button>
      <Button
        onClick={(): void => send('SHUFFLE')}
        selected={shuffle}
        tight={false}
        disabled={!ready}
        class={classes}
        title={`Shuffle - ${shuffle ? 'On' : 'Off'}`}
      >
        <ShuffleIcon height={18} />
      </Button>
      <Button
        onClick={(): void => send('REPEAT')}
        selected={isRepeat}
        tight={false}
        class={cx(classes, 'relative')}
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
          {repeat === Repeat.Song ? 'S' : repeat === Repeat.Video ? 'V' : null}
        </span>
      </Button>
    </Fragment>
  )
}

export default Controls

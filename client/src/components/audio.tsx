import { FunctionalComponent, h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { PlayerSend } from '../machine/types'
import { Track } from '../types'

interface Props {
  selected?: Track
  play?: boolean
  send: PlayerSend
}

const Audio: FunctionalComponent<Props> = ({ selected, play, send }) => {
  const player = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    send({ type: 'PLAYER_READY', player: player.current })
  }, [send, player])

  useEffect(() => {
    if (!player || !selected || !play) return

    const interval: NodeJS.Timeout = setInterval(() => {
      if (!player || !selected || !play) {
        return clearInterval(interval)
      }

      if (player.current.currentTime >= selected.end) {
        clearInterval(interval)
        send('MEDIA_END_TRACK')
      }
    }, 1000)

    return (): void => clearInterval(interval)
  }, [player, selected, play, send])

  return (
    <audio
      onEnded={() => send('MEDIA_END_TRACK')}
      onPlay={() => send('MEDIA_PLAY')}
      onPause={() => send('MEDIA_PAUSE')}
      ref={player}
    ></audio>
  )
}

export default Audio

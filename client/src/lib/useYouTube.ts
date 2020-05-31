/// <reference types="@types/youtube" />
import { useEffect, useRef, useCallback, Ref } from 'preact/hooks'
import { ytToMachineEvent } from '../machine'
import * as Machine from '../machine/types'

declare global {
  interface Window {
    YT?: {
      PlayerState: YT.PlayerState
      Player: YT.Player
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

const addScript = (src: string, onError: OnErrorEventHandler): void => {
  const script = document.createElement('script')
  script.onerror = onError
  script.setAttribute('src', src)
  document.body.appendChild(script)
}

type Events = {
  onReady: (p: YT.Player) => void
  onStateChange: (state: Machine.YouTubeEvent['type']) => void
  onError: (error: Error) => void
}

const useYouTube = (domRef: Ref<HTMLDivElement>, events: Events): YT.Player => {
  const playerRef = useRef<YT.Player>(null)
  const setPlayer = useCallback((): void => {
    if (domRef.current) {
      playerRef.current = new window.YT.Player(domRef.current, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
        },
        events: {
          onReady: (): void => events.onReady(playerRef.current),
          onStateChange: (e): void => {
            const event = ytToMachineEvent[e.data]
            event && events.onStateChange(event)
          },
          onError: (e): void =>
            events.onError(new Error(`Player error: ${e.data}`)),
        },
      })
    }
  }, [domRef, events])

  useEffect(() => {
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = setPlayer
      addScript('https://www.youtube.com/iframe_api', (e) =>
        events.onError(new Error(e instanceof Event ? 'Player load error' : e))
      )
    } else {
      setPlayer()
    }
  }, [setPlayer, events])

  return playerRef.current
}

export default useYouTube

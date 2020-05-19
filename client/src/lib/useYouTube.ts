/// <reference types="@types/youtube" />
import { useEffect, useRef, useCallback, Ref } from 'preact/hooks'
import * as debug from './debug'

declare global {
  interface Window {
    YT?: {
      PlayerState: YT.PlayerState
      Player: YT.Player
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

const addScript = (src: string): void => {
  const script = document.createElement('script')
  script.setAttribute('src', src)
  document.body.appendChild(script)
}

const useYouTube = (
  domRef: Ref<HTMLDivElement>,
  onReady: (p: YT.Player) => void,
  onStateChange: (e: YT.OnStateChangeEvent) => void
): YT.Player => {
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
          onReady: (): void => onReady(playerRef.current),
          onStateChange,
          onError: (e: YT.OnErrorEvent): void => debug.error('PLAYER ERROR', e),
        },
      })
    }
  }, [domRef, onReady, onStateChange])

  useEffect(() => {
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = setPlayer
      addScript('https://www.youtube.com/iframe_api')
    } else {
      setPlayer()
    }
  }, [setPlayer])

  return playerRef.current
}

export default useYouTube

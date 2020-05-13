import { FunctionalComponent, h } from "preact"
import { useState, useCallback, useEffect, useMemo } from "preact/hooks"
import { useMachine } from "@xstate/react/lib/fsm"
import { Videos as TVideos, Tracks, Track, Progress } from "../types"
import YouTube from "./youtube"
import Videos from "./videos"
// import UpNext from "../../components/UpNext"
import Controls from "./controls"
import playerMachine from "../lib/player-machine"
import debug from "../lib/debug"

interface Props {
  videos: TVideos
  tracks: Tracks
  initial?: {
    nowPlaying: string
  }
}

const Player: FunctionalComponent<Props> = ({ videos, tracks, initial }) => {
  const initialSelectedIndex = useMemo(
    () => tracks.findIndex((t: Track) => t.id === initial?.nowPlaying),
    [tracks, initial?.nowPlaying]
  )
  const machine = useMemo(
    () =>
      playerMachine({
        videos,
        tracks,
        selectedIndex: initialSelectedIndex,
      }),
    [videos, tracks, initialSelectedIndex]
  )
  const [state, send, service] = useMachine(machine)

  useEffect(() => {
    const subscription = service.subscribe((s) => debug("PLAYER_MACHINE", s))
    return (): void => subscription.unsubscribe()
  }, [service])

  const onSelect = useCallback(
    (track: Track) => send({ type: "SELECT_TRACK", track }),
    [send]
  )

  const [progress, setProgress] = useState<Progress>({ time: 0, percent: 0 })
  const onProgress = useCallback((p: Progress): void => setProgress(p), [
    setProgress,
  ])

  const selected = state.context.tracks[state.context.selectedIndex]

  return (
    <div class="max-w-screen-md border-r border-l mx-auto border-gray-600">
      <div class="sticky top-0">
        <div class="bg-gray-600">
          <YouTube
            selected={selected}
            play={state.matches("playing") || state.matches("requestingPlay")}
            send={send}
            onProgress={onProgress}
            splash={
              <div class="bg-gray-200 w-full h-full flex justify-center items-center shadow-inner">
                Hey now...
              </div>
            }
          />
        </div>
        <div class="bg-white border-t border-b border-gray-600 shadow-sm">
          <Controls
            selected={selected}
            progress={progress}
            play={state.matches("playing") || state.matches("requestingPlay")}
            send={send}
          />
        </div>
      </div>
      <div>
        <Videos
          videos={state.context.videos}
          selected={selected}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}

export default Player

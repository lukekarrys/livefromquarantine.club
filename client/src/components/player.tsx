import { FunctionalComponent, h, Fragment } from "preact"
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
        tracks,
        selectedIndex: initialSelectedIndex,
      }),
    [tracks, initialSelectedIndex]
  )
  const [state, send, service] = useMachine(machine)

  useEffect(() => {
    const subscription = service.subscribe((s) =>
      debug("PLAYER MACHINE", {
        value: s.value,
        actions: s.actions.length ? s.actions.map((a) => a.type) : undefined,
        context: s.context,
      })
    )
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

  // TODO: share urls

  useEffect(() => {
    const listener = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
      else if (e.key === "ArrowRight") send("NEXT")
      else if (e.key === " ") {
        e.preventDefault()
        state.matches("playing")
          ? send("PAUSE")
          : state.matches("paused") || state.matches("initial")
          ? send("PLAY")
          : undefined
      }
      // else if (e.key === "s") setShuffle()
      // else if (e.key === "x") resetQueue()
      // else if (e.key === "r") setRepeat()
    }
    document.addEventListener("keydown", listener)
    return (): void => document.removeEventListener("keydown", listener)
  }, [send, state])

  return (
    <Fragment>
      <div class="sticky top-0">
        <div class="bg-gray-600">
          <YouTube
            selected={selected}
            play={state.matches("playing")}
            send={send}
            onProgress={onProgress}
          >
            <div class="bg-gray-200 w-full h-full flex justify-center items-center shadow-inner">
              Hey now...
            </div>
          </YouTube>
        </div>
        <div class="bg-white border-t border-b border-gray-600 shadow-sm">
          <Controls
            selected={selected}
            progress={progress}
            play={state.matches("playing") || state.matches("requesting")}
            send={send}
          />
        </div>
      </div>
      <div>
        <Videos videos={videos} selected={selected} onSelect={onSelect} />
      </div>
    </Fragment>
  )
}

export default Player

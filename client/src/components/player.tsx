import { FunctionalComponent, h, Fragment } from "preact"
import { useState, useCallback, useEffect, useMemo, useRef } from "preact/hooks"
import { useMachine } from "@xstate/react/lib/fsm"
import { Videos as TVideos, Tracks, Track, Progress, TrackId } from "../types"
import YouTube from "./youtube"
import Videos from "./videos"
// import UpNext from "../../components/UpNext"
import Controls from "./controls"
import playerMachine, { selectors } from "../lib/player-machine"
import debug from "../lib/debug"

interface Props {
  videos: TVideos
  tracks: Tracks
  initial?: {
    nowPlaying: TrackId
  }
}

const Player: FunctionalComponent<Props> = ({ videos, tracks, initial }) => {
  const machine = useMemo(
    () => playerMachine({ tracks, selectedId: initial?.nowPlaying }),
    [tracks, initial?.nowPlaying]
  )
  const [state, send, service] = useMachine(machine)

  useEffect(() => {
    const subscription = service.subscribe((s) =>
      debug("PLAYER MACHINE", {
        value: s.value,
        actions: s.actions.length ? s.actions.map((a) => a.type) : undefined,
        order: s.context.order,
        tracks: s.context.tracks,
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

  const selected = selectors.getSelected(state.context)

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

  const playerContainer = useRef<HTMLDivElement>()

  return (
    <Fragment>
      <div class="sticky top-0" ref={playerContainer}>
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
            shuffle={state.context.shuffle}
            send={send}
          />
        </div>
      </div>
      <div>
        <Videos
          videos={videos}
          selected={selected}
          onSelect={onSelect}
          playerRef={playerContainer}
        />
      </div>
    </Fragment>
  )
}

export default Player

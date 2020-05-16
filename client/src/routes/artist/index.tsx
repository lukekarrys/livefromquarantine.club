import { FunctionalComponent, h, Fragment } from "preact"
import { useEffect, useState } from "preact/hooks"
import { useMachine } from "@xstate/react/lib/fsm"
import playerMachine from "../../machine"
import Player from "../../components/player"
import fetchData from "../../lib/api"
import debug from "../../lib/debug"
import { ArtistId, Videos, ArtistMeta } from "../../types"

interface Props {
  artist: ArtistId
}

// TODO: add  initial upnext
const initial = JSON.parse(
  localStorage.getItem("initial-data") ||
    JSON.stringify({} || { nowPlaying: "kRu_s_Er_vs-740" })
)

const Artist: FunctionalComponent<Props> = ({ artist }) => {
  const [videos, setVideos] = useState<Videos | undefined>(undefined)
  const [meta, setMeta] = useState<ArtistMeta | undefined>(undefined)
  const [state, send, service] = useMachine(playerMachine)

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

  useEffect(() => {
    send("FETCH_START")
    fetchData(artist)
      .then((res) => {
        setVideos(res.videos)
        setMeta(res.meta)
        send({
          type: "FETCH_SUCCESS",
          tracks: res.tracks,
          selectedId: initial?.nowPlaying,
        })
      })
      .catch((error) => send({ type: "FETCH_ERROR", error }))
  }, [artist, send])

  useEffect(() => {
    if (meta?.title) {
      document.title = meta.title
    }
  }, [meta, meta?.title])

  return (
    <div class="max-w-screen-md border-r border-l mx-auto border-gray-600">
      <Player state={state} send={send} videos={videos}>
        {state.matches("idle") || state.matches("loading")
          ? "Loading..."
          : state.matches("error")
          ? state.context.error?.message ?? "Error"
          : meta && (
              <Fragment>
                <h1 class="text-xl">{meta.title}</h1>
                <div
                  class="flex flex-col items-center"
                  dangerouslySetInnerHTML={{
                    __html: meta.main || "",
                  }}
                />
              </Fragment>
            )}
      </Player>
    </div>
  )
}

export default Artist

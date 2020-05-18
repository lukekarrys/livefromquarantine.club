import { FunctionalComponent, h, Fragment } from "preact"
import { useEffect, useState } from "preact/hooks"
import { useMachine } from "@xstate/react/lib/fsm"
import playerMachine from "../../machine"
import Player from "../../components/player"
import fetchData from "../../lib/api"
import useDebugService from "../../lib/useDebugService"
import { ArtistId, Videos, ArtistMeta, TrackId } from "../../types"

interface Props {
  artist: ArtistId
}

// TODO: add  initial upnext
const hash = window.location.hash.slice(1)
const initialTracks: TrackId[] = hash ? (hash.split(",") as TrackId[]) : []

const Artist: FunctionalComponent<Props> = ({ artist }) => {
  const [videos, setVideos] = useState<Videos | undefined>(undefined)
  const [meta, setMeta] = useState<ArtistMeta | undefined>(undefined)
  const [state, send, service] = useMachine(playerMachine)

  useDebugService(service)

  useEffect(() => {
    send("FETCH_START")
    fetchData(artist)
      .then((res) => {
        setVideos(res.videos)
        setMeta(res.meta)
        send({
          type: "FETCH_SUCCESS",
          tracks: res.tracks,
          trackId: initialTracks[0],
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
          ? state.context.error.message ?? "Error"
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

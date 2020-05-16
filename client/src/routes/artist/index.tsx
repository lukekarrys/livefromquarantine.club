import { FunctionalComponent, h } from "preact"
import { useEffect } from "preact/hooks"
import { useMachine } from "@xstate/react/lib/fsm"
import dataMachine, { FetchEvent } from "../../lib/data-machine"
import Player from "../../components/player"
import fetchData from "../../lib/api"
import { Data } from "../../types"

interface Props {
  artist: string
}

// TODO: add  initial upnext
const initial = JSON.parse(
  localStorage.getItem("initial-data") ||
    JSON.stringify({} || { nowPlaying: "kRu_s_Er_vs-740" })
)

const Artist: FunctionalComponent<Props> = ({ artist }) => {
  const [state, send] = useMachine(dataMachine, {
    actions: {
      fetchData: (context, event): void => {
        fetchData((event as FetchEvent).artistId)
          .then((res: Data) => send({ type: "SUCCESS", data: res }))
          .catch((error: Error) => send({ type: "ERROR", data: error }))
      },
    },
  })

  useEffect(() => {
    send({ type: "FETCH", artistId: artist })
  }, [artist, send])

  useEffect(() => {
    if (state.context.data?.meta.title) {
      document.title = state.context.data?.meta.title
    }
  }, [state.context.data?.meta.title])

  return (
    <div class="max-w-screen-md border-r border-l mx-auto border-gray-600">
      {state.matches("loading") ? (
        <Player loadingState="loading">Loading...</Player>
      ) : state.matches("failure") ? (
        <Player loadingState="error">
          {state.context.error?.message ?? "Error"}
        </Player>
      ) : state.matches("success") ? (
        <Player
          loadingState="success"
          videos={state.context.data.videos}
          tracks={state.context.data.tracks}
          initial={initial}
        >
          <h1 class="text-xl">{state.context.data.meta.title}</h1>
          <div
            class="flex flex-col items-center"
            dangerouslySetInnerHTML={{
              __html: state.context.data.meta.main || "",
            }}
          />
        </Player>
      ) : null}
    </div>
  )
}

export default Artist

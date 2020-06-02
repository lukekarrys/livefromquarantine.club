import { FunctionalComponent, h, Fragment } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useMachine } from '@xstate/react/lib/fsm'
import playerMachine from '../../machine'
import * as selectors from '../../machine/selectors'
import Player from '../../components/player'
import fetchData from '../../lib/api'
import useDebugService from '../../lib/useDebugService'
import { ArtistId, Videos, ArtistMeta, TrackId, SelectMode } from '../../types'

interface Props {
  artist: ArtistId
}

const hash = window.location.hash.slice(1)
const upNext: TrackId[] = hash ? (hash.split(',') as TrackId[]) : []
const selectMode = (localStorage.getItem('selectMode') as unknown) as SelectMode

const Artist: FunctionalComponent<Props> = ({ artist }) => {
  const [videos, setVideos] = useState<Videos | undefined>(undefined)
  const [meta, setMeta] = useState<ArtistMeta | undefined>(undefined)
  const [state, send, service] = useMachine(playerMachine)

  useDebugService(service)

  useEffect(() => {
    send('FETCH_START')
    fetchData(artist)
      .then((res) => {
        setVideos(res.videos)
        setMeta(res.meta)
        send({
          type: 'FETCH_SUCCESS',
          tracks: res.tracks,
          trackIds: upNext,
          selectMode: selectMode && +selectMode,
        })
      })
      .catch((error) => send({ type: 'FETCH_ERROR', error }))
  }, [artist, send])

  useEffect(() => {
    if (meta?.title) {
      document.title = meta.title
    }
  }, [meta, meta?.title])

  return (
    <div class="max-w-screen-c c:border-l c:border-r border-r-0 border-l-0 mx-auto border-gray-600 relative">
      <Player state={state} send={send} videos={videos}>
        {state.matches('idle') || state.matches('loading')
          ? 'Loading...'
          : state.matches('error')
          ? state.context.error.message ?? 'Error'
          : selectors.isReady(state)
          ? meta && (
              <Fragment>
                <h1 class="text-xl text-center">{meta.title}</h1>
                <div
                  class="flex flex-col items-center text-center main"
                  dangerouslySetInnerHTML={{
                    __html: meta.main || '',
                  }}
                />
              </Fragment>
            )
          : null}
      </Player>
    </div>
  )
}

export default Artist

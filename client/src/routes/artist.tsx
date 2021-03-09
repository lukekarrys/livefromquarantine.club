import { FunctionalComponent, h, Fragment } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { useMachine } from '@xstate/react/lib/fsm'
import playerMachine from '../machine'
import * as selectors from '../machine/selectors'
import Player from '../components/player'
import fetchData from '../lib/api'
import * as debugService from '../lib/useDebugService'
import { artistsById } from '../artists'
import {
  ArtistId,
  Videos,
  ArtistMeta,
  TrackId,
  SelectMode,
  Repeat,
  AccessToken,
  MediaMode,
} from '../types'

interface Props {
  artist: ArtistId
  accessToken?: AccessToken
}

const hash = window.location.hash.slice(1)
const upNext: TrackId[] = hash ? (hash.split(',') as TrackId[]) : []

const getLocalStorageValues = (artist: ArtistId) => {
  const { audio: artistHasAudio } = artistsById[artist]

  const lsMediaMode = localStorage.getItem('mediaMode')
  const lsSelectMode = localStorage.getItem('selectMode')
  const lsSshuffle = localStorage.getItem('shuffle')
  const lsRepeat = localStorage.getItem('repeat')

  const shuffle =
    lsSshuffle === 'true' || lsSshuffle === 'false'
      ? lsSshuffle === 'true'
      : undefined

  const repeat = lsRepeat != null ? (+lsRepeat as Repeat) : undefined

  const selectMode =
    lsSelectMode != null ? (+lsSelectMode as SelectMode) : undefined

  const mediaMode = artistHasAudio
    ? lsMediaMode != null
      ? (+lsMediaMode as MediaMode)
      : MediaMode.YouTube
    : MediaMode.YouTubeOnly

  return { mediaMode, selectMode, shuffle, repeat }
}

const Artist: FunctionalComponent<Props> = ({ artist, accessToken }) => {
  const [videos, setVideos] = useState<Videos | undefined>(undefined)
  const [meta, setMeta] = useState<ArtistMeta | undefined>(undefined)
  const [state, send, service] = useMachine(playerMachine)
  const modeValues = useMemo(() => getLocalStorageValues(artist), [artist])

  debugService.useService(service)

  useEffect(() => {
    send('FETCH_START')

    send({
      type: 'SET_MODES',
      ...modeValues,
    })

    fetchData(artist, accessToken)
      .then((res) => {
        setVideos(res.videos)
        setMeta(res.meta)
        send({
          type: 'FETCH_SUCCESS',
          tracks: res.tracks,
          trackIds: upNext,
        })
      })
      .catch((error: Error) => send({ type: 'FETCH_ERROR', error }))
  }, [artist, send, accessToken, modeValues])

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
                  class="flex flex-col items-center text-center dangerouslysetinnerhtml"
                  dangerouslySetInnerHTML={{
                    __html: meta.description || '',
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

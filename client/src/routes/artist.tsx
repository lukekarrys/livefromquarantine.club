import { FunctionalComponent, h, Fragment } from 'preact'
import { useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks'
import { useMachine } from '@xstate/react/lib/fsm'
import playerMachine from '../machine'
import * as selectors from '../machine/selectors'
import Player from '../components/player'
import fetchData from '../lib/api'
import * as debugService from '../lib/useDebugService'
import { artistsById } from '../artists'
import { parseQs } from '../lib/url'
import {
  ArtistId,
  Videos,
  ArtistMeta,
  TrackId,
  SelectMode,
  Repeat,
  AccessToken,
  MediaMode,
  DefaultMediaMode,
} from '../types'

interface Props {
  artist: ArtistId
  accessToken?: AccessToken
}

const hash = window.location.hash.slice(1)
const upNext: TrackId[] = hash ? (hash.split(',') as TrackId[]) : []

const getModeValues = (artist: ArtistId) => {
  const { audio: artistHasAudio } = artistsById[artist] || {}

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

  let mediaMode = MediaMode.YouTubeOnly

  if (artistHasAudio) {
    const forceAudio = Object.prototype.hasOwnProperty.call(
      parseQs(window.location.search),
      'audio'
    )
    if (forceAudio) {
      // If we have a search param then force to audio mode
      // this will set it in localstorage for future visits in the action.
      mediaMode = MediaMode.Audio
    } else if (lsMediaMode != null) {
      const lsMediaModeValue = +lsMediaMode as MediaMode
      // If the type is YouTubeOnly but the artist has audio
      // (maybe if this changed previously) then revert to the default
      mediaMode =
        lsMediaModeValue === MediaMode.YouTubeOnly
          ? DefaultMediaMode
          : lsMediaModeValue
    } else {
      // The default is YouTube
      mediaMode = DefaultMediaMode
    }
  }

  return { mediaMode, selectMode, shuffle, repeat }
}

const Artist: FunctionalComponent<Props> = ({ artist, accessToken }) => {
  const [videos, setVideos] = useState<Videos | undefined>(undefined)
  const [meta, setMeta] = useState<ArtistMeta | undefined>(undefined)
  const [state, send, service] = useMachine(playerMachine)
  const modeValues = useMemo(() => getModeValues(artist), [artist])

  debugService.useService(service)

  useLayoutEffect(() => {
    send({
      type: 'SET_MODES',
      ...modeValues,
    })
  }, [send, modeValues])

  useEffect(() => {
    send('FETCH_START')
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
  }, [artist, send, accessToken])

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

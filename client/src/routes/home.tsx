import { FunctionalComponent, h, Fragment } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'
import artists from '../../artists.json'
import Button from '../components/button'
import Input from '../components/input'
import { url } from '../lib/url'
import manifest from '../manifest.json'
import { AccessToken } from '../types'

interface Props {
  accessToken?: AccessToken
  requireAuth?: boolean
}

const parseRouteId = (str: string): string => {
  try {
    const url = new URL(str)
    return url.searchParams.get('list') ?? url.searchParams.get('v') ?? ''
  } catch (e) {
    return str
  }
}

const Home: FunctionalComponent<Props> = ({ accessToken, requireAuth }) => {
  const [videosId, setVideosId] = useState('')
  const parsedId = parseRouteId(videosId)

  useEffect(() => {
    document.title = manifest.name
  }, [])

  return (
    <Fragment>
      <div class="mt-4 max-w-screen-sm mx-auto px-2">
        {accessToken || !requireAuth ? (
          <form
            onSubmit={(e): void => {
              e.preventDefault()
              parsedId && route(`/${parsedId}`)
            }}
          >
            <label class="mb-4 block text-xl text-center" htmlFor="videosInput">
              Enter a YouTube playlist or video:
            </label>
            <Input
              id="videosInput"
              class="z-10 relative w-full block text-center text-xl p-1 rounded-t"
              placeholder="youtube.com/playlist?list=PL&hellip;"
              rounded={false}
              onInput={(e): void =>
                setVideosId((e.target as HTMLInputElement).value)
              }
            />
            <Button
              as="input"
              type="submit"
              border={false}
              rounded={false}
              class="w-full block text-center mb-4 text-xl rounded-b border-l border-r border-b"
              disabled={!parsedId}
              value="Submit"
            />
          </form>
        ) : (
          <Fragment>
            <h2 class="mb-4 block text-xl text-center">
              Authenticate with YouTube to load any playlist:
            </h2>
            <Button
              as="a"
              class="mb-4 text-xl text-center block"
              href={url('https://accounts.google.com/o/oauth2/v2/auth', {
                client_id:
                  '873120465885-3194c6caoq5243ehirku1aefcoh039if.apps.googleusercontent.com',
                redirect_uri: window.location.origin,
                response_type: 'token',
                scope: 'https://www.googleapis.com/auth/youtube.readonly',
              })}
            >
              Login with YouTube
            </Button>
          </Fragment>
        )}
      </div>
      <div class="mt-4 max-w-screen-sm mx-auto px-2">
        <h2 class="mb-4 text-xl text-center">
          Or choose from one of these playlists:
        </h2>
        {artists.map((artist) => (
          <Button
            as="a"
            key={artist.id}
            href={`/${artist.id}`}
            class="w-full block text-center mb-4 text-xl"
          >
            {artist.name}
          </Button>
        ))}
      </div>
    </Fragment>
  )
}

export default Home

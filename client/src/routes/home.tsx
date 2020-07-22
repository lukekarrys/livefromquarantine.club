import { FunctionalComponent, h, Fragment } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { route } from 'preact-router'
import artists from '../../artists.json'
import Button from '../components/button'
import Input from '../components/input'
import * as qs from '../lib/searchParams'
import manifest from '../manifest.json'
import { AccessToken } from '../types'

interface Props {
  accessToken?: AccessToken
}

const parseRouteId = (str: string): string => {
  try {
    const url = new URL(str)
    return url.searchParams.get('list') ?? url.searchParams.get('v') ?? ''
  } catch (e) {
    return str
  }
}

const Home: FunctionalComponent<Props> = ({ accessToken }) => {
  const [videosId, setVideosId] = useState('')
  const parsedId = parseRouteId(videosId)

  useEffect(() => {
    document.title = manifest.name
  }, [])

  return (
    <Fragment>
      <div class="mt-4 max-w-screen-sm mx-auto px-2">
        {accessToken ? (
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
            <label class="mb-4 block text-xl text-center" htmlFor="videosInput">
              Authenticate with YouTube to load any playlist:
            </label>
            <Button
              as="a"
              class="mb-4 text-xl text-center block"
              href={`https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify(
                {
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  client_id:
                    '873120465885-3194c6caoq5243ehirku1aefcoh039if.apps.googleusercontent.com',
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  redirect_uri: window.location.origin,
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  response_type: 'token',
                  scope: 'https://www.googleapis.com/auth/youtube.readonly',
                }
              )}`}
            >
              Login with YouTube
            </Button>
          </Fragment>
        )}
      </div>
      <div class="mt-4 max-w-screen-sm mx-auto px-2">
        <h1 class="mb-4 text-xl text-center">
          Or choose from one of these playlists:
        </h1>
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

import { FunctionalComponent, h, Fragment } from 'preact'
import { route } from 'preact-router'
import artists from '../../../artists.json'
import Button from '../../components/button'
import Input from '../../components/input'
import { useState } from 'preact/hooks'

const parseUrl = (str: string): string => {
  try {
    const url = new URL(str)
    return url.searchParams.get('list') ?? url.searchParams.get('v') ?? ''
  } catch (e) {
    return str
  }
}

const Home: FunctionalComponent = () => {
  const [videosId, setVideosId] = useState('')
  const parsedId = parseUrl(videosId)
  return (
    <Fragment>
      <form
        class="mt-4 max-w-screen-sm mx-auto px-2"
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

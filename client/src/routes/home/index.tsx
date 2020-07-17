import { FunctionalComponent, h, Fragment } from 'preact'
import { route } from 'preact-router'
import artists from '../../../artists.json'
import Button from '../../components/button'
import Input from '../../components/input'
import { useState } from 'preact/hooks'

const Home: FunctionalComponent = () => {
  const [playlistId, setPlalistId] = useState('')
  return (
    <Fragment>
      <form
        class="mt-4 max-w-screen-sm mx-auto px-2"
        onSubmit={(e): void => {
          e.preventDefault()
          route(`/${playlistId}`)
        }}
      >
        <label class="mb-4 block text-xl text-center" htmlFor="playlistId">
          Enter a YouTube Playlist ID
        </label>
        <Input
          id="playlistId"
          class="z-10 relative w-full block text-center text-xl p-1 border rounded-t rounded-b-none"
          placeholder="PLG507gy2-Kp-SV2YxVUxndVgnRuoNrEJ5"
          border={false}
          onInput={(e): void =>
            setPlalistId((e.target as HTMLInputElement).value)
          }
        />
        <Button
          as="input"
          type="submit"
          border={false}
          class="w-full block text-center mb-4 text-xl rounded-t-none rounded-b border-l border-r border-b"
          disabled={!playlistId}
          value="Go to playlist"
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

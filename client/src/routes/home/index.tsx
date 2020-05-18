import { FunctionalComponent, h } from "preact"
import config from "../../../../config.json"
import Button from "../../components/button"

const Home: FunctionalComponent = () => {
  return (
    <div class="mt-4 max-w-screen-md mx-auto px-2">
      {config.artists.map((artist) => (
        <Button
          as="a"
          key={artist.id}
          href={`/${artist.id}`}
          class="w-full block text-center mb-4 text-4xl"
        >
          {artist.name}
        </Button>
      ))}
    </div>
  )
}

export default Home

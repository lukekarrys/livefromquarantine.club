import { FunctionalComponent, h } from "preact"
import config from "../../../../config.json"
import Button from "../../components/button"

const Home: FunctionalComponent = () => {
  return (
    <div class="mt-4 max-w-screen-md mx-auto border-gray-600 px-2 md:px-0">
      {config.artists.map((artist) => (
        <Button
          as="a"
          key={artist}
          href={`/${artist}`}
          class="w-full block text-center mb-4 text-4xl uppercase"
        >
          {artist}
        </Button>
      ))}
    </div>
  )
}

export default Home

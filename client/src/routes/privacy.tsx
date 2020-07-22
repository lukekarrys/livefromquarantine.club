import { FunctionalComponent, h } from 'preact'

const Home: FunctionalComponent = () => {
  return (
    <div class="mt-4 max-w-screen-sm mx-auto px-2">
      <p>
        This website will never gather, store, or sell any information about
        you. All data requests to YouTube are proxied through an API for ease of
        use, but no information is ever stored in a database. Your
        authentication token for YouTube is only stored in your local browser
        and can be deleted or revoked at anytime.
      </p>
    </div>
  )
}

export default Home

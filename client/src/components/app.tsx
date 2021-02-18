import { FunctionalComponent, h } from 'preact'
import { Route, Router, RouterOnChangeArgs, route } from 'preact-router'
import Artist from '../routes/artist'
import Home from '../routes/home'
import Privacy from '../routes/privacy'
import Logout from '../routes/logout'
import artists from '../../artists.json'
import * as qs from '../lib/searchParams'
import { AccessToken } from '../types'

type LSAccessToken = AccessToken | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
if ((module as any).hot) {
  require('preact/debug')
}

const getAccessToken = (): LSAccessToken => {
  const params = qs.parse(location.hash.substring(1))

  if (params.access_token) {
    location.hash = ''
    const accessToken = params.access_token as AccessToken
    localStorage.setItem('accessToken', accessToken)
    return accessToken
  }

  const lsAccessToken = localStorage.getItem('accessToken') as LSAccessToken

  return lsAccessToken || undefined
}

const requireAuth = false
const accessToken = getAccessToken()
const unauthedUrls = [
  '/',
  '/privacy',
  '/logout',
  ...artists.map((a) => `/${a.id}`),
]

const handleRoute = (e: RouterOnChangeArgs): void => {
  if (!unauthedUrls.includes(e.url) && !accessToken && requireAuth) {
    route('/', true)
  }
}

const App: FunctionalComponent = () => {
  return (
    <div id="app">
      <Router onChange={handleRoute}>
        <Route
          path="/"
          component={Home}
          accessToken={accessToken}
          requireAuth={requireAuth}
        />
        <Route path="/privacy" component={Privacy} />
        <Route path="/logout" component={Logout} />
        <Route path="/:artist" component={Artist} accessToken={accessToken} />
      </Router>
    </div>
  )
}

export default App

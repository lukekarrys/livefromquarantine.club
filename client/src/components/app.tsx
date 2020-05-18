import { FunctionalComponent, h } from 'preact'
import { Route, Router } from 'preact-router'
import Artist from '../routes/artist'
import Home from '../routes/home'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
  // tslint:disable-next-line:no-var-requires
  require('preact/debug')
}

const App: FunctionalComponent = () => {
  return (
    <div id="app">
      <Router>
        <Route path="/" component={Home} />
        <Route path="/:artist" component={Artist} />
      </Router>
    </div>
  )
}

export default App

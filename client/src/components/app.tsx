import { FunctionalComponent, h } from "preact"
import { Route, Router } from "preact-router"

import Artist from "../routes/artist"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// if ((module as any).hot) {
//   // window.location.reload()
// }

const App: FunctionalComponent = () => {
  return (
    <div id="app">
      <Router>
        <Route path="/" component={Artist} artist="seanbonnette" />
        <Route path="/:artist" component={Artist} />
      </Router>
    </div>
  )
}

export default App

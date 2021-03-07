import '../api/dotenv'
import { cli } from '../api/artists'
import { build, write } from './build'

Promise.all(cli().map((id) => build(id).then((body) => write(id, body))))
  .then(() => console.log('Saved fixtures'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

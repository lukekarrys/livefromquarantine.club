const cache = require('@netlify/cache-utils')
const path = require('path')

const directories = ['.', 'client', 'server']

const x = {
  async onPreBuild() {
    await cache.restore(directories.map((d) => path.join(d, 'node_modules')))
  },
  async onPostBuild() {
    await Promise.all(
      directories.map((d) =>
        cache.save(path.join(d, 'node_modules'), {
          digests: [path.join(d, 'package-lock.json')],
        })
      )
    )
  },
}

x.onPreBuild().then(console.log).catch(console.error)

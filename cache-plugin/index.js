const path = require('path')

const directories = ['.', 'client', 'server']

const x = {
  async onPreBuild({ utils: { cache } }) {
    const preBuildDirectories = directories.map((d) =>
      path.join(d, 'node_modules')
    )

    console.log('onPreBuild:', preBuildDirectories)

    await cache.restore(preBuildDirectories)
  },
  async onPostBuild({ utils: { cache } }) {
    await Promise.all(
      directories.map((d) => {
        const saveParameters = [
          path.join(d, 'node_modules'),
          {
            digests: [path.join(d, 'package-lock.json')],
          },
        ]

        console.log('onPostBuild:', saveParameters)

        cache.save(...saveParameters)
      })
    )
  },
}

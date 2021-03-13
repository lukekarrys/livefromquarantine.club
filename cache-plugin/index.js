const path = require('path')

const directories = ['.', 'client', 'server']

module.exports = {
  async onPreBuild({ utils: { cache } }) {
    const preBuildDirectories = directories.map((d) =>
      path.join(d, 'node_modules')
    )

    console.log(
      'onPreBuild: restoring from cache',
      preBuildDirectories.join(', ')
    )

    await cache.restore(preBuildDirectories)
  },
  async onPostBuild({ utils: { cache } }) {
    await Promise.all(
      directories.map(async (d) => {
        const saveParameters = [
          path.join(d, 'node_modules'),
          {
            digests: [path.join(d, 'package-lock.json')],
          },
        ]

        console.log('onPostBuild: saving to cache', saveParameters)

        await cache.save(...saveParameters)
      })
    )
  },
}

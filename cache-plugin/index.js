module.exports = {
  async onPreBuild({ utils: { cache } }) {
    const directories = [
      './node_modules',
      './client/node_modules',
      './server/node_modules',
    ]

    console.log(
      'onPreBuild: restoring from cache',
      JSON.stringify(directories, null, 2)
    )

    await cache.restore(directories)
  },
  async onPostBuild({ utils: { cache } }) {
    const directories = [
      [
        './node_modules',
        {
          digests: ['./node_modules/package-lock.json'],
        },
      ],
      [
        './client/node_modules',
        {
          digests: ['./node_modules/client/package-lock.json'],
        },
      ],
      [
        './server/node_modules',
        {
          digests: ['./node_modules/server/package-lock.json'],
        },
      ],
    ]

    console.log(
      'onPostBuild: saving to cache',
      JSON.stringify(directories, null, 2)
    )

    await Promise.all(directories.map((directory) => cache.save(...directory)))
  },
}

const path = require('path')
const fs = require('fs').promises
const mkdirp = require('mkdirp')
const { cli } = require('../artists')
const parsePreload = require('./parse-preload')

const publicPath = (...parts) =>
  path.join(__dirname, '..', '..', 'public', 'preloaded', ...parts)

const writeFile = async (id, data) => {
  await mkdirp(publicPath())
  await fs.writeFile(publicPath(`${id}.json`), JSON.stringify(data))
}

const buildAndSaveArtists = async (artists = []) => {
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      writeFile(id, parsePreload(id))
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

buildAndSaveArtists(cli())
  .then((res) => {
    console.log(res)
    if (res.some((r) => !r.ok)) {
      throw new Error('Build error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

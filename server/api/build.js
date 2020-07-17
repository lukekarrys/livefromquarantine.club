const path = require('path')
const fs = require('fs').promises
const mkdirp = require('mkdirp')
const config = require('../../config')
const buildArtistFromId = require('./parse-preloaded')

const publicPath = (...parts) =>
  path.join(__dirname, '..', '..', 'public', 'api', ...parts)

const writeFile = async (id, data) => {
  await mkdirp(publicPath())
  await fs.writeFile(publicPath(`${id}.json`), JSON.stringify(data))
}

const buildAndSaveArtists = async (...artists) => {
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      writeFile(id, buildArtistFromId(id))
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
buildAndSaveArtists(
  ...(cliArtists.length ? cliArtists : config.artists.map((a) => a.id))
)
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

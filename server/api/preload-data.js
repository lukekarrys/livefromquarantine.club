const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const fs = require('fs').promises
const prettier = require('prettier')
const mkdirp = require('mkdirp')
const { cli } = require('./artists')
const { getPlaylist } = require('./fetch-youtube')

const { API_KEY } = process.env

const hideKey = (str) => str.replace(API_KEY, 'X'.repeat(3))

const dataPath = (...parts) =>
  path.join(__dirname, '..', 'functions', 'videos', ...parts)

const writeFile = async (fileId, resp) => {
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await mkdirp(dataPath())
  await fs.writeFile(
    dataPath(`${fileId}.json`),
    prettier.format(JSON.stringify(resp, null, 2), {
      parser: 'json',
      ...prettierOptions,
    })
  )
}

const main = async (artists = []) =>
  Promise.all(
    artists.map((artist) =>
      getPlaylist(artist.playlistId, { key: API_KEY })
        .then((resp) => writeFile(artist.id, resp))
        .then(() => ({ id: artist.id, ok: true }))
        .catch((error) => ({
          id: artist.id,
          ok: false,
          error,
          response: error.response && error.response.data,
        }))
    )
  )

main(cli(true))
  .then((res) => {
    console.log(hideKey(JSON.stringify(res, null, 2)))
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

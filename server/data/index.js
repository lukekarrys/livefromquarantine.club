const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const fs = require('fs').promises
const prettier = require('prettier')
const config = require('../../config')
const getFullPlaylistData = require('./fetch')

const { API_KEY } = process.env

const hideKey = (str) => str.replace(API_KEY, 'X'.repeat(3))

const writeFile = async (fileId, resp) => {
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await fs.writeFile(
    path.join(__dirname, `${fileId}.json`),
    prettier.format(JSON.stringify(resp, null, 2), {
      parser: 'json',
      ...prettierOptions,
    })
  )
}

const getArtist = async (artistKey) => {
  let artist = null
  try {
    artist = require(`../api/${artistKey}`)
  } catch (e) {
    throw new Error(`Invalid artistKey: ${artistKey}`)
  }

  if (!artist) {
    throw new Error(`Invalid artistKey: ${artistKey}`)
  }

  const resp = await getFullPlaylistData(artist.playlistId, API_KEY)
  await writeFile(artist.id, resp)
}

const main = async (...artists) => {
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      getArtist(id)
        .then(() => ({ id, ok: true }))
        .catch((error) => ({
          id,
          ok: false,
          error,
          response: error.response && error.response.data,
        }))
    )
  )
}

const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
main(...(cliArtists.length ? cliArtists : config.artists.map((a) => a.id)))
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

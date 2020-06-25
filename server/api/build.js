const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const assert = require('assert')
const fs = require('fs').promises
const mkdirp = require('mkdirp')
const config = require('../../config')
const { main: mainParser } = require('./parse')

const validate = (data) => {
  data.forEach((v) => {
    assert.ok(v.title, `Every video has a title`)
    assert.ok(v.id, `Has an id - ${v.title}`)
    assert.equal(
      typeof v.duration,
      'number',
      `Duration is a number - ${v.title}`
    )
    assert.ok(Array.isArray(v.songs), `Has songs - ${v.title}`)
    v.songs.forEach((s) => {
      assert.ok(s.name, `Every song has a name - ${v.title}`)
      assert.ok(
        typeof s.time.start === 'number',
        `Every song has a start time - ${v.title} / ${s.name}`
      )
      assert.ok(
        s.time.start >= 0,
        `Every song has a valid timestamp - ${v.title} / ${s.name}`
      )
    })
  })
}

const publicPath = (...parts) =>
  path.join(__dirname, '..', '..', 'public', 'api', ...parts)

const buildData = (parser, data) => {
  const parsedData = mainParser(data.videos, parser.parsers).filter(
    (video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    }
  )

  validate(parsedData)

  return parsedData
}

const buildArtist = (artistKey) => {
  const artistData = require(`../data/${artistKey}.json`)
  const artistParser = require(`./${artistKey}`)

  if (!artistData || !artistParser) {
    throw new Error(`Invalid artistKey: ${artistKey}`)
  }

  return {
    meta: artistParser.meta,
    data: buildData(artistParser, artistData),
  }
}

const writeFile = async (data) => {
  const { id } = data.meta
  await mkdirp(publicPath())
  await fs.writeFile(publicPath(`${id}.json`), JSON.stringify(data))
}

const buildAndSave = async (...artists) => {
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      writeFile(buildArtist(id))
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

if (require.main === module) {
  const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
  buildAndSave(
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
} else {
  module.exports = buildArtist
}

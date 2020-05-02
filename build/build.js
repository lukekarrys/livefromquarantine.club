const assert = require('assert')
const fs = require('fs').promises
const path = require('path')
const prettier = require('prettier')
const mainParser = require('./parse')

const validate = (data) => {
  assert.ok(
    data.every((v) => v.title),
    'Every video has a title'
  )
  assert.ok(
    data.every((v) => v.id),
    'Every video has an id'
  )
  assert.ok(
    data.every((v) => v.songs),
    'Every video has songs'
  )
  assert.ok(
    data.every((v) =>
      v.songs.every(
        (s) => s.name && s.time.start && s.time.start.match(/^\d+:\d+$/)
      )
    ),
    'Every song has a name and time'
  )
  assert.ok(
    data.every((v) => v.songs.every((s) => s.name && s.time.start)),
    'Every song has a name and time'
  )
}

const parsePath = (...parts) => path.join(__dirname, ...parts)
const publicPath = (...parts) => path.join(__dirname, '..', 'public', ...parts)

const writeParsed = async (parser, data) => {
  const { id } = parser.meta

  let index = (await fs.readFile(parsePath('index.html'))).toString()
  let manifest = (await fs.readFile(parsePath('manifest.json'))).toString()

  Object.entries(parser.meta).forEach(([key, value]) => {
    index = index.replace(new RegExp(`{{${key}}}`, 'g'), value)
    manifest = index.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })

  const parsedData = mainParser(
    data.videos,
    data.comments,
    parser.parsers
  ).filter((video, index, videos) => {
    // The same video could be included multiple times in a playlist so remove dupes
    return videos.findIndex((v) => v.id === video.id) === index
  })

  validate(parsedData)

  await fs.writeFile(publicPath(`${id}.html`), index)
  await fs.writeFile(publicPath(`manifest-${id}.json`), index)
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await fs.writeFile(
    publicPath(`${id}.js`),
    prettier.format(`window.__DATA = ${JSON.stringify(parsedData, null, 2)}`, {
      parser: 'babel',
      ...prettierOptions,
    })
  )
}

const buildArtist = async (artistKey) => {
  const artistData = require(`../data/${artistKey}.json`)
  const artistParser = require(`./${artistKey}`)

  if (!artistData || !artistParser) {
    throw new Error(`Invalid artistKey: ${artistKey}`)
  }

  await writeParsed(artistParser, artistData)
}

const main = async (...artists) => {
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      buildArtist(id)
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

main(...process.argv.slice(2).flatMap((v) => v.split(',')))
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

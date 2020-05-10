require('dotenv').config()

const assert = require('assert')
const fs = require('fs').promises
const path = require('path')
const prettier = require('prettier')
const { minify: htmlMinify } = require('html-minifier')
const config = require('../config')
const { main: mainParser } = require('./parse')

const PRODUCTION = process.env.NODE_ENV === 'production'

const validate = (data) => {
  data.forEach((v) => {
    assert.ok(v.title, `Every video has a title`)
    assert.ok(v.id, `Has an id - ${v.title}`)
    assert.equal(
      typeof v.duration,
      'number',
      `Duration is a number - ${v.title}`
    )
    assert.ok(v.songs, `Has songs - ${v.title}`)
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

const parsePath = (...parts) => path.join(__dirname, ...parts)
const publicPath = (...parts) => path.join(__dirname, '..', 'public', ...parts)

const writeParsed = async (parser, data) => {
  const { id } = parser.meta

  let index = (await fs.readFile(parsePath('index.html'))).toString()
  let manifest = (await fs.readFile(parsePath('manifest.json'))).toString()

  Object.entries(parser.meta).forEach(([key, value]) => {
    index = index.replace(new RegExp(`{{${key}}}`, 'g'), value)
    manifest = manifest.replace(new RegExp(`{{${key}}}`, 'g'), value)
    if (PRODUCTION) {
      index = index.replace(/\bapp\.(css|js)/g, 'app.min.$1')
    }
  })

  const parsedData = mainParser(data.videos, parser.parsers).filter(
    (video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    }
  )

  validate(parsedData)

  await fs.writeFile(
    publicPath(`${id}.html`),
    PRODUCTION ? htmlMinify(index, { collapseWhitespace: true }) : index
  )
  await fs.writeFile(publicPath(`manifest-${id}.json`), manifest)
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await fs.writeFile(
    publicPath(`${id}.js`),
    PRODUCTION
      ? `window.__DATA=${JSON.stringify(parsedData)}`
      : prettier.format(
          `window.__DATA = ${JSON.stringify(parsedData, null, 2)}`,
          {
            parser: 'babel',
            ...prettierOptions,
          }
        )
  )
  await fs.writeFile(
    publicPath(`${id}.json`),
    PRODUCTION
      ? JSON.stringify(parsedData)
      : prettier.format(JSON.stringify(parsedData, null, 2), {
          parser: 'json',
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

const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
main(...(cliArtists.length ? cliArtists : config.artists))
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

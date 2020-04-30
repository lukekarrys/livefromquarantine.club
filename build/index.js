const assert = require('assert')
const fs = require('fs').promises
const path = require('path')

const raw = require('../data/data.json')

const parsers = [require('./ajj'), require('./dcfc')]

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

const writeParsed = async (parser) => {
  const { id } = parser.meta
  let index = (await fs.readFile(parsePath('index.html'))).toString()
  Object.entries(parser.meta).forEach(([key, value]) => {
    index = index.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })

  const data = parser.parse(raw[id].items)
  validate(data)
  if (parser.validate) parser.validate(data)

  await fs.writeFile(publicPath(`${id}.html`), index)
  await fs.writeFile(
    publicPath(`${id}.js`),
    `window.__DATA = ${JSON.stringify(data, null, 2)}`
  )
}

const main = async () => {
  await Promise.all(parsers.map(writeParsed))
}

main().catch(console.error)

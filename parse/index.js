const assert = require('assert')
const fs = require('fs').promises
const path = require('path')
const raw = require('../data/data.json')
const ajj = require('./ajj')
const dcfc = require('./dcfc')

const parsers = { ajj, dcfc }

const validate = (data) => {
  assert.ok(data.every(v => v.title), 'Every video has a title')
  assert.ok(data.every(v => v.id), 'Every video has an id')
  assert.ok(data.every(v => v.songs), 'Every video has songs')
  assert.ok(data.every(v => v.songs.every(s => s.name && s.time.start && s.time.start.match(/^\d+:\d+$/))), 'Every song has a name and time')
  assert.ok(data.every(v => v.songs.every(s => s.name && s.time.start)), 'Every song has a name and time')
}

const parsePath = (...parts) => path.join(__dirname, ...parts)
const publicPath = (...parts) => path.join(__dirname, '..', 'public', ...parts)

const writeParsed = async (name) => {
  const parser = parsers[name]

  let index = (await fs.readFile(parsePath('index.html'))).toString()
  Object.entries(parser.meta).forEach(([key, value]) => {
    index = index.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })

  const data = parser.parse(raw[name].items)
  validate(data)
  if (parser.validate) parser.validate(data)

  await fs.writeFile(publicPath(`${name}.html`), index)
  await fs.writeFile(publicPath(`${name}.js`), `window.__DATA=${JSON.stringify(data, null, 2)};`)
  if (name === 'ajj') {
    await fs.writeFile(publicPath('index.html'), index)
  }
  
}

const main = async () => {
  await Promise.all(Object.keys(parsers).map(writeParsed))
}

main().catch(console.error)
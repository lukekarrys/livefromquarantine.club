const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const fs = require('fs').promises
const functionHandler = require('../functions/videos/videos').handler
const { cli } = require('../api/artists')

const buildFixture = async (id) => {
  const res = await functionHandler({
    queryStringParameters: { id },
    httpMethod: 'GET',
  })
  return JSON.parse(res.body)
    .data.map(
      (video) =>
        `${video.title}\n${video.id}\n` +
        video.songs.map((song) => `${song.start} | ${song.name}`).join('\n')
    )
    .join(`\n${'-'.repeat(10)}\n`)
}

const fixturePath = (id) => path.join(__dirname, 'fixtures', `${id}.txt`)

if (require.main === module) {
  Promise.all(
    cli().map((id) =>
      buildFixture(id).then((body) => fs.writeFile(fixturePath(id), body))
    )
  )
    .then(() => console.log('Saved fixtures'))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
} else {
  module.exports.build = buildFixture
  module.exports.get = (id) => fs.readFile(fixturePath(id), 'utf-8')
}

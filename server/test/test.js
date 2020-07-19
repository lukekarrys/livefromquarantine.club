const test = require('ava')
const fixtures = require('./fixtures')
const { artists } = require('../api/artists')

for (const artist of artists) {
  test(artist, async (t) => {
    const current = await fixtures.get(artist)
    const now = await fixtures.build(artist)
    t.is(current, now, artist)
  })
}

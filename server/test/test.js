const test = require('ava')
const fixtures = require('./fixtures')
const { artists } = require('../api/artists')

test('Artists', async (t) => {
  for (const artist of artists) {
    const current = await fixtures.get(artist)
    const now = await fixtures.build(artist)
    t.is(current, now, artist)
  }
})

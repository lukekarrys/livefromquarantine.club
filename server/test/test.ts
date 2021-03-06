import test from 'ava'
import { get, build } from './build-fixture'
import { artists } from '../api/artists'

for (const artist of artists) {
  test(artist, async (t) => {
    const current = await get(artist)
    const now = await build(artist)
    t.is(current, now, artist)
  })
}

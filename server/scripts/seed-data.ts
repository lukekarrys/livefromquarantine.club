import '../api/dotenv'

import path from 'path'
import { cli, artistDataPath } from '../api/artists'
import { PreloadedData } from '../types'
import * as db from '../api/db'
import importEnv from '../api/import'

const getArtist = async (artist: string) => {
  try {
    const data = await importEnv<PreloadedData>(
      path.join(artistDataPath, `${artist}.json`)
    )
    await db.update(artist, data)
    return { id: artist, ok: true }
  } catch (error: unknown) {
    return {
      id: artist,
      ok: false,
      error,
    }
  }
}

Promise.all(cli().map(getArtist))
  .then((res) => {
    console.log(JSON.stringify(res, null, 2))
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .then(() => db.client.$disconnect())
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

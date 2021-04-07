import './dotenv'

import { cli } from './artists'
import { PreloadedData } from '../types'
import createClient from './fauna'
import importEnv from './import'

const db = createClient(process.env.FAUNA_KEY)

const getArtist = async (artist: string) => {
  try {
    const data = await importEnv<PreloadedData>(
      `../functions/videos/${artist}.json`
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

// TODO: This is not being used currently but can be used in the future
// once the API functions are set to also look for preloaded data in Fauna
Promise.all(cli().map(getArtist))
  .then((res) => {
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

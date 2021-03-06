import './dotenv'
import path from 'path'
import { promises as fs } from 'fs'
import prettier from 'prettier'
import mkdirp from 'mkdirp'
import { cliFull } from './artists'
import { getPlaylist } from './fetch-youtube'
import { Artist } from '../types'

const { API_KEY = '' } = process.env

const hideKey = (str: string) => str.replace(API_KEY, 'X'.repeat(3))

const dataPath = (...parts: string[]) =>
  path.join(__dirname, '..', 'functions', 'videos', ...parts)

const writeFile = async (fileId: string, resp: Record<string, unknown>) => {
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await mkdirp(dataPath())
  await fs.writeFile(
    dataPath(`${fileId}.json`),
    prettier.format(JSON.stringify(resp, null, 2), {
      parser: 'json',
      ...prettierOptions,
    })
  )
}

const main = async (artists: Artist[] = []) =>
  Promise.all(
    artists.map((artist) =>
      getPlaylist(artist.playlistId, { key: API_KEY })
        .then((resp) => writeFile(artist.id, resp))
        .then(() => ({ id: artist.id, ok: true }))
        .catch((error: unknown) => ({
          id: artist.id,
          ok: false,
          error,
        }))
    )
  )

cliFull()
  .then(main)
  .then((res) => {
    console.log(hideKey(JSON.stringify(res, null, 2)))
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

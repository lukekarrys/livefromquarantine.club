import '../api/dotenv'
import path from 'path'
import { promises as fs } from 'fs'
import prettier from 'prettier'
import mkdirp from 'mkdirp'
import { cliFull, artistDataPath } from '../api/artists'
import { getPlaylist } from '../api/fetch-youtube'
import { Artist } from '../types'

const { YOUTUBE_KEY = '' } = process.env

const hideKey = (str: string) => str.replace(YOUTUBE_KEY, 'X'.repeat(3))

const writeFile = async (fileId: string, resp: Record<string, unknown>) => {
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await mkdirp(artistDataPath)
  await fs.writeFile(
    path.join(artistDataPath, `${fileId}.json`),
    prettier.format(JSON.stringify(resp, null, 2), {
      parser: 'json',
      ...prettierOptions,
    })
  )
}

const main = async (artists: Artist[]) =>
  Promise.all(
    artists.map((artist) =>
      getPlaylist(artist.playlistId, { key: YOUTUBE_KEY })
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

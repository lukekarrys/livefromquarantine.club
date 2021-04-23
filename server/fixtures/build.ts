import { join } from 'path'
import { promises as fs } from 'fs'
import { getParsedArtist, artistParsedPath } from '../api/artists'

export const build = async (id: string): Promise<string> => {
  const { data } = await getParsedArtist(id)

  if (!data) {
    throw new Error(`Could not get data for ${id}`)
  }

  return data
    .map(
      (video) =>
        `${video.title}\nID: ${video.id}\n` +
        video.songs.map((song) => `${song.start} | ${song.name}`).join('\n')
    )
    .join(`\n${'-'.repeat(10)}\n`)
}

const path = (id: string): string => join(artistParsedPath, `${id}.txt`)

export const write = (id: string, body: string): Promise<void> =>
  fs.writeFile(path(id), body)

export const get = (id: string): Promise<string> =>
  fs.readFile(path(id), 'utf-8')

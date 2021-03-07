import '../api/dotenv'
import { join } from 'path'
import { promises as fs } from 'fs'
import { handler as functionHandler } from '../functions/videos/videos'
import { ResponseSuccess } from '../types'

export const build = async (id: string): Promise<string> => {
  const res = await functionHandler({
    queryStringParameters: { id },
    httpMethod: 'GET',
  })

  const { data } = JSON.parse(res.body) as ResponseSuccess

  if (!data) {
    throw new Error(`Could not get data for ${id}`)
  }

  return data
    .map(
      (video) =>
        `${video.title}\n${video.id}\n` +
        video.songs.map((song) => `${song.start} | ${song.name}`).join('\n')
    )
    .join(`\n${'-'.repeat(10)}\n`)
}

const path = (id: string): string => join(__dirname, 'fixtures', `${id}.txt`)

export const write = (id: string, body: string): Promise<void> =>
  fs.writeFile(path(id), body)

export const get = (id: string): Promise<string> =>
  fs.readFile(path(id), 'utf-8')
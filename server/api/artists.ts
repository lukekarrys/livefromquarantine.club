import fs from 'fs'
import path from 'path'
import { Artist, PreloadedData, ResponseSuccess } from '../types'
import importEnv from './import'
import parseVideos from './parse-videos'

export const artistDataPath = path.resolve(__dirname, '..', 'data', 'raw')
export const artistParsedPath = path.resolve(__dirname, '..', 'data', 'parsed')
const artistParserPath = path.resolve(__dirname, '..', 'functions', 'videos')

export const artists: string[] = fs
  .readdirSync(artistDataPath)
  .filter((f: string) => path.extname(f) === '.json')
  .map((f: string) => path.basename(f, '.json'))

const importArtist = async (id: string): Promise<Artist> =>
  importEnv<Artist>(path.join(artistParserPath, id))

const importArtistData = async (id: string): Promise<PreloadedData> =>
  importEnv<PreloadedData>(path.join(artistDataPath, `${id}.json`))

const getFull = async (id: string): Promise<Artist> => {
  try {
    return await importArtist(id)
  } catch (e) {
    throw new Error(
      `Could not find artist ${id}${
        e instanceof Error && e.stack ? `\n${e.stack}` : ''
      }`
    )
  }
}

export const getParsedArtist = async (id: string): Promise<ResponseSuccess> => {
  const artist = await importArtist(id)
  const data = await importArtistData(id)
  return {
    meta: {
      ...data.meta,
      ...artist.meta,
    },
    data: parseVideos(data.videos, artist),
  }
}

export const getFullArtists = (): Promise<Artist[]> =>
  Promise.all(artists.map(getFull))

export const cli = (): string[] => {
  const cli = process.argv.slice(2).flatMap((v) => v.split(','))
  const unknownCli = cli.some((artistId) => !artists.includes(artistId))

  if (unknownCli) {
    throw new Error(
      `Unknown artist ids '${cli.join(', ')}' were passed to the CLI`
    )
  }

  // If nothing from cli, return all
  return cli.length ? cli : artists
}

export const cliFull = (): Promise<Artist[]> => Promise.all(cli().map(getFull))

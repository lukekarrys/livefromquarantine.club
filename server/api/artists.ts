import fs from 'fs'
import path from 'path'
//import { tsImport } from 'ts-import'
import { Artist } from '../types'

const artistPath = path.resolve(__dirname, '..', 'functions', 'videos')

export const artists: string[] = fs
  .readdirSync(artistPath)
  .filter((f: string) => path.extname(f) === '.json')
  .map((f: string) => path.basename(f, '.json'))

const importArtist = async (id: string): Promise<Artist> => {
  const m = (await import(path.join(artistPath, `${id}.ts`))) as {
    default: Artist
  }
  return m.default
}

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

import { ParsedSong } from '../types'

const TIMESTAMP = /(?:\d+:)?\d+:\d+/
const startWithTimestamp = new RegExp(`^[(]?${TIMESTAMP.source}`)
const endWithTimestamp = new RegExp(`${TIMESTAMP.source}[)]?$`)

const getLinesWithTimestamp = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => startWithTimestamp.test(l) || endWithTimestamp.test(l))

const parseSeconds = (str: string): number =>
  str
    .split(':')
    .reverse()
    .map((v, i) => parseInt(v, 10) * Math.pow(60, i))
    .reduce((sum, v) => sum + v, 0)

const nonNullable = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined

const getSongsFromText = (text: string) => {
  const songs: ParsedSong[] = getLinesWithTimestamp(text)
    .map((line) => {
      const [start] = TIMESTAMP.exec(line) || []

      if (!start) return null

      return {
        name: line
          .trim()
          .replace(new RegExp(TIMESTAMP.source, 'g'), '')
          .replace(/^(\()?[\s-—–:|]+/, (__, p1) =>
            typeof p1 === 'string' ? p1 : ''
          )
          .replace(/[\s-—–:|]+(\))?$/, (__, p1) =>
            typeof p1 === 'string' ? p1 : ''
          )
          .replace(/[\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        start: parseSeconds(start),
      }
    })
    .filter(nonNullable)

  if (!songs[0]) return null

  return songs[0].start > 0 ? [{ name: 'Intro', start: 0 }, ...songs] : songs
}

const findSetlist = (text?: string): ParsedSong[] | null =>
  text == null || getLinesWithTimestamp(text).length < 2
    ? null
    : getSongsFromText(text)

export default findSetlist

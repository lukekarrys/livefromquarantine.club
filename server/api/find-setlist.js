const TIMESTAMP = /(?:\d+:)?\d+:\d+/
const startWithTimestamp = new RegExp(`^[(]?${TIMESTAMP.source}`)
const endWithTimestamp = new RegExp(`${TIMESTAMP.source}[)]?$`)

const getLinesWithTimestamp = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => startWithTimestamp.test(l) || endWithTimestamp.test(l))

const parseSeconds = (str) => {
  const seconds = str
    .split(':')
    .reverse()
    .map((v, i) => parseInt(v, 10) * Math.pow(60, i))
    .reduce((sum, v) => sum + v, 0)
  return seconds
}

const getSongsFromText = (text) => {
  const songs = getLinesWithTimestamp(text)
    .map((line) => {
      const [start] = line.match(TIMESTAMP) || []

      if (!start) return null

      return {
        name: line
          .trim()
          .replace(new RegExp(TIMESTAMP.source, 'g'), '')
          .replace(/^(\()?[\s-—–:|]+/, (match, p1) => p1 || '')
          .replace(/[\s-—–:|]+(\))?$/, (match, p1) => p1 || '')
          .replace(/[\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        start: parseSeconds(start),
      }
    })
    .filter(Boolean)

  if (!songs.length) return null

  return songs[0].start > 0 ? [{ name: 'Intro', start: 0 }, ...songs] : songs
}

const findSetlist = (text) =>
  getLinesWithTimestamp(text).length >= 3 && getSongsFromText(text)

module.exports = findSetlist

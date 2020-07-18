const callParser = (p, v) => (typeof p === 'function' ? p(v) : v)

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

const getSongsFromText = (text, parsers = {}) => {
  const songs = getLinesWithTimestamp(text)
    .map((line) => {
      const startEndTimestamps = new RegExp(
        `(${TIMESTAMP.source})(?: ?- ?(${TIMESTAMP.source}))?`
      )

      const [match, start, end] = line.match(startEndTimestamps) || []

      if (!match || !start) return null

      const name = line.replace(match, '')

      return {
        name: callParser(
          parsers.songName,
          name
            .trim()
            .replace(/^(\()?[\s-—:]+/, (match, p1) => p1 || '')
            .replace(/[\s-—:]+(\))?$/, (match, p1) => p1 || '')
            .replace(/[\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        ),
        time: {
          start: parseSeconds(start),
          end: end && parseSeconds(end),
        },
      }
    })
    .filter(Boolean)

  return songs.length ? songs : null
}

const findSetlist = (text, parsers = {}) =>
  getLinesWithTimestamp(text).length >= 3 && getSongsFromText(text, parsers)

module.exports = findSetlist

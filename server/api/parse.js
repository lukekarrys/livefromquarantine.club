const assert = require('assert')

const TIMESTAMP = /(?:\d+:)?\d+:\d+/

const startWithTimestamp = new RegExp(`^[(]?${TIMESTAMP.source}`)
const endWithTimestamp = new RegExp(`${TIMESTAMP.source}[)]?$`)

const getLinesWithTimestamp = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => startWithTimestamp.test(l) || endWithTimestamp.test(l))

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

const findSetlist = (text) => {
  return getLinesWithTimestamp(text).length >= 3 && getSongsFromText(text)
}

const parseSeconds = (str) => {
  const seconds = str
    .split(':')
    .reverse()
    .map((v, i) => parseInt(v, 10) * Math.pow(60, i))
    .reduce((sum, v) => sum + v, 0)
  return seconds
}

const callParser = (p, v) => (typeof p === 'function' ? p(v) : v)

const parseVideo = (video, parsers = {}) => {
  const {
    snippet: {
      title,
      description,
      resourceId: { videoId },
    },
    comments: { items: comments },
    contentDetails: { duration },
  } = video

  let songs = null

  if (TIMESTAMP.test(description)) {
    songs = getSongsFromText(
      callParser(parsers.description, description),
      parsers
    )
  }

  if (songs === null) {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i].snippet.topLevelComment.snippet.textDisplay
      const setlist = findSetlist(comment)
      // Get timestamps from top rated comments by finding the first one with
      // at least 3 timestamps
      if (setlist) {
        songs = setlist
        break
      }
    }
  }

  return {
    title: callParser(parsers.title, title),
    id: videoId,
    duration,
    // Videos with no songs will just have a "Play All" button
    songs: songs || [],
  }
}

const validate = (data) => {
  data.forEach((v) => {
    assert.ok(v.title, `Every video has a title`)
    assert.ok(v.id, `Has an id - ${v.title}`)
    assert.equal(
      typeof v.duration,
      'number',
      `Duration is a number - ${v.title}`
    )
    assert.ok(Array.isArray(v.songs), `Has songs - ${v.title}`)
    v.songs.forEach((s) => {
      assert.ok(s.name, `Every song has a name - ${v.title}`)
      assert.ok(
        typeof s.time.start === 'number',
        `Every song has a start time - ${v.title} / ${s.name}`
      )
      assert.ok(
        s.time.start >= 0,
        `Every song has a valid timestamp - ${v.title} / ${s.name}`
      )
    })
  })
}

module.exports.parseData = (videos, parsers = {}) => {
  const data = videos.items.map((video) => parseVideo(video, parsers))

  const parsedData = callParser(parsers.data, data).filter(
    (video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    }
  )

  validate(parsedData)

  return parsedData
}

module.exports.findSetlist = findSetlist

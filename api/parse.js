const TIMESTAMP = /(?:\d+:)?\d+:\d+/

const startWithTimestamp = new RegExp(`^[(]?${TIMESTAMP.source}`)
const endWithTimestamp = new RegExp(`${TIMESTAMP.source}[)]?$`)

const getLinesWithTimestamp = (text) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => startWithTimestamp.test(l) || endWithTimestamp.test(l))

const isCommentMaybeSetlist = (commentText) => {
  return getLinesWithTimestamp(commentText).length >= 3
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

const getSongsFromText = (text, parsers) => {
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

const parseVideo = (video, parsers) => {
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

  if (!songs) {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i].snippet.topLevelComment.snippet.textDisplay
      // Get timestamps from top rated comments by finding the first one with
      // at least 3 timestamps
      if (isCommentMaybeSetlist(comment)) {
        const songsFromComment = getSongsFromText(
          callParser(parsers.comment, comment),
          parsers
        )
        if (songsFromComment) {
          songs = songsFromComment
          break
        }
      }
    }
  }

  return {
    title: callParser(parsers.title, title),
    id: videoId,
    duration,
    songs,
  }
}

module.exports.main = (videos, parsers) => {
  const data = videos.items.map((video) => parseVideo(video, parsers))
  return callParser(parsers.data, data)
}

module.exports.isCommentMaybeSetlist = isCommentMaybeSetlist

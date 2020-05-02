const TIMESTAMP = /(?:\d+:)?\d+:\d+/

const startWithTimestamp = new RegExp(`^[(]?${TIMESTAMP.source}`)
const endWithTimestamp = new RegExp(`${TIMESTAMP.source}[)]?$`)

const callParser = (p, v) => (typeof p === 'function' ? p(v) : v)

const getSongsFromText = (text, parsers) => {
  const lines = text.split('\n')

  const linesWithTimestamp = lines
    .map((l) => l.trim())
    .filter((l) => startWithTimestamp.test(l) || endWithTimestamp.test(l))

  const songs = linesWithTimestamp
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
          start,
          end,
        },
      }
    })
    .filter(Boolean)

  return songs.length ? songs : null
}

const isCommentMaybeSetlist = (commentText) => {
  const commentTimestamps =
    commentText.match(new RegExp(TIMESTAMP.source, 'g')) || []
  return commentTimestamps.length >= 3
}

const parseVideo = (video, comments, parsers) => {
  const {
    title,
    description,
    resourceId: { videoId },
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
      const comment = comments[i].topLevelComment.snippet.textDisplay
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
    songs,
  }
}

module.exports = (videos, comments, parsers) => {
  const data = videos.items.map((video) => {
    const id = video.snippet.resourceId.videoId
    return parseVideo(
      video.snippet,
      comments[id].items.map((c) => c.snippet),
      parsers
    )
  })
  return callParser(parsers.data, data)
}

module.exports.isCommentMaybeSetlist = isCommentMaybeSetlist
module.exports.timestamp = TIMESTAMP

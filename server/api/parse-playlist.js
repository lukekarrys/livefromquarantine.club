const assert = require('assert')
const findSetlist = require('./find-setlist')

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

  let songs = []

  const descriptionSetlist = findSetlist(description)

  if (descriptionSetlist) {
    songs = descriptionSetlist
  } else {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i]
      const commentSetlist = findSetlist(
        callParser(
          parsers.comment,
          callParser(
            parsers[comment.id],
            comment.snippet.topLevelComment.snippet.textDisplay
          )
        )
      )
      // Get timestamps from top rated comments by finding the first one with
      // at least 3 timestamps
      if (commentSetlist) {
        songs = commentSetlist
        break
      }
    }
  }

  return {
    title: callParser(parsers.title, callParser(parsers[videoId], title)).trim(),
    id: videoId,
    duration,
    // Videos with no songs will just have a "Play All" button
    songs: songs,
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
        typeof s.start === 'number',
        `Every song has a start time - ${v.title} / ${s.name}`
      )
      assert.ok(
        s.start >= 0,
        `Every song has a valid timestamp - ${v.title} / ${s.name}`
      )
    })
  })
}

module.exports = (videos, parsers = {}) => {
  const data = videos.items
    .map((video) => parseVideo(video, parsers))
    .filter((video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    })

  validate(data)

  return data
}

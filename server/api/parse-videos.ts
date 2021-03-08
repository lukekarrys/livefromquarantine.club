import { Artist } from '../types'
import assert from 'assert'
import findSetlist from './find-setlist'
import { VideoWithComments, ParsedVideo, ParsedSong } from '../types'

const callParser = (
  parser: ((s: string) => string) | undefined,
  value: string
): string => (typeof parser === 'function' ? parser(value) : value)

const parseVideo = (video: VideoWithComments, artist?: Artist) => {
  const {
    titleParser,
    videoParsers = {},
    commentParsers = {},
    omitCommentIds = [],
  } = artist || {}

  const {
    id: videoId,
    snippet: { title, description },
    comments,
    contentDetails: { duration },
  } = video

  let songs: ParsedSong[] = []

  const videoParser = videoParsers[videoId] || {}
  const descriptionSetlist = findSetlist(description)
  const parserSetlist = findSetlist(videoParser.comments)

  if (descriptionSetlist) {
    songs = descriptionSetlist
  } else if (parserSetlist) {
    songs = parserSetlist
  } else {
    for (let i = 0; i < comments.length; i++) {
      const {
        id: commentId,
        snippet: { topLevelComment },
      } = comments[i]

      if (omitCommentIds.includes(commentId)) {
        continue
      }

      const commentParser = commentParsers[commentId]
      const commentSetlist = findSetlist(
        callParser(commentParser, topLevelComment.snippet.textDisplay)
      )

      // Comments are already sorted so return the first comment with a valid setlist
      if (commentSetlist) {
        songs = commentSetlist
        break
      }
    }
  }

  return {
    title: callParser(titleParser, callParser(videoParser.title, title))
      .trim()
      .replace(/\s+/g, ' '),
    id: videoId,
    duration: +duration,
    // Videos with no songs will just have a "Play All" button
    songs: songs,
  }
}

const validate = (data: ParsedVideo[]) => {
  data.forEach((v) => {
    assert.ok(v.title, `Every video has a title`)
    assert.ok(v.id, `Has an id - ${v.title}`)
    assert.strictEqual(
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

export default (
  videos: VideoWithComments[],
  artist?: Artist
): ParsedVideo[] => {
  const data = videos
    .filter((video) => !(artist?.omitVideoIds || []).includes(video.id))
    .map((video) => parseVideo(video, artist))
    .filter((video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    })

  validate(data)

  return data
}

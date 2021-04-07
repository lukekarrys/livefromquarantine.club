import { Artist } from '../types'
import assert from 'assert'
import findSetlist from './find-setlist'
import { VideoWithComments, ParsedVideo, ParsedSong } from '../types'

const findSetlistWithIntro = (text: string) => {
  const songs = findSetlist(text)
  // When parsing the data, add an intro track if the setlist
  // doesn't already have one. This ensures that in the client
  // the first track always starts at 0 since most setlists don't
  // explicitly list that as a  track
  return songs && songs[0].start > 0
    ? [{ name: 'Intro', start: 0 }, ...songs]
    : songs
}

const parseVideo = (video: VideoWithComments, artist?: Artist) => {
  const {
    titleParser,
    videoParsers = {},
    commentParsers = {},
    omitCommentIds = [],
  } = artist || {}

  const { id: videoId } = video
  const videoParser = videoParsers[videoId]
  const parsedVideo = videoParser ? videoParser(video) : video

  const {
    snippet: { description },
    comments,
    contentDetails: { duration },
  } = parsedVideo

  let songs: ParsedSong[] = []

  const descriptionSetlist = findSetlistWithIntro(description)

  if (descriptionSetlist) {
    songs = descriptionSetlist
  } else {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i]
      const { id: commentId } = comment
      const commentParser = commentParsers[commentId]
      const parsedComment = commentParser ? commentParser(comment) : comment

      if (omitCommentIds.includes(commentId)) {
        continue
      }

      const commentSetlist = findSetlistWithIntro(
        parsedComment.snippet.topLevelComment.snippet.textDisplay
      )

      // Comments are already sorted so return the first comment with a valid setlist
      if (commentSetlist) {
        songs = commentSetlist
        break
      }
    }
  }

  const title = titleParser
    ? titleParser(parsedVideo)
    : parsedVideo.snippet.title

  return {
    title: title.trim().replace(/\s+/g, ' '),
    id: videoId,
    duration: +duration,
    // Videos with no songs will just have a "Play All" button
    songs: songs.sort((a, b) => a.start - b.start),
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
    .sort(artist?.sortVideos)
    .map((video) => parseVideo(video, artist))
    .filter((video, index, videos) => {
      // The same video could be included multiple times in a playlist so remove dupes
      return videos.findIndex((v) => v.id === video.id) === index
    })

  validate(data)

  return data
}

import { Artist, VideoWithComments } from '../../types'
import { createComment } from '../../api/youtube'

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const dateRegex = new RegExp(`\\b(${months.join('|')})\\s(\\d+)\\b`, 'i')

const titleToDateText = (title: string): string =>
  title.replace(/Live from Quarantine[\s-]+-?/i, '')

const getVideoDate = (video: VideoWithComments) => {
  const [, month, day] =
    dateRegex.exec(titleToDateText(video.snippet.title).toLowerCase()) || []

  const publishedYear = video.snippet.publishedAt.split('-')[0]

  // Doing some hacks here to special case video ids to the year they were performed.
  // Currently this is for times when the video was performed near the end of a calendar
  // year and then uploaded in the next year. There is no good way to detect this from a
  // single video, and would need to examine other videos near it in the list which isn't easy
  // to do with how the videos are run through the parsers in this file.
  let year = publishedYear
  if (video.id === 'h6I2zx7Pju8') {
    year = '2020'
  }

  if (!month || !day || !year) {
    throw new Error(
      `Could not find date when sorting for video: ${video.snippet.title}`
    )
  }

  const d = new Date()
  // TIL that setMonth takes a second optional parameter. In this case, since we are
  // trying to create a date by setting month/day/year after creating a new Date(). Since
  // new Date() is currently set to now, this will cause things to break when the current day
  // is a day in which other months have no days. Eg March 29 when February has 28 days.
  // The good news is that this caused tests to break but took me forever to find the cause.
  // 2021-03-29T https://app.netlify.com/teams/lukekarrys/builds/6061519d3c1a53000722bf1b
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth#description
  d.setMonth(months.indexOf(month.toLowerCase()), +day)
  d.setDate(+day)
  d.setFullYear(+year)
  return d
}

const titleParser = (video: VideoWithComments): string => {
  const date = getVideoDate(video)
  const month = months[date.getMonth()]
  const titleMonth = month[0].toUpperCase() + month.slice(1)
  return `${titleMonth} ${date.getDate()}, ${date.getFullYear()}`
}

const artist: Artist = {
  id: 'seanbonnette',
  playlistId: 'PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
  meta: {
    title: 'Sean Bonnette – Live From Quarantine',
    description: [
      '<a href="http://www.patreon.com/ajjtheband" target="_blank">Patreon</a>',
      '<a href="https://venmo.com/bonnseanette" target="_blank">Venmo</a>',
      '<a href="https://paypal.me/bonnseanette" target="_blank">Paypal</a>',
      '<a href="https://cash.app/$bonnseanette" target="_blank">Cash App</a>',
      '<a href="http://shop.ajjtheband.com" target="_blank">Merch</a>',
    ].join(''),
  },
  titleParser,
  videoParsers: {
    PmJa6qlob0Q: (video: VideoWithComments) => {
      video.comments = [
        createComment(video, `0:42 A Big Day for Grimley\n4:23 Oo-de-lally`),
      ]
      return video
    },
    JBFJwxSCtwk: (video: VideoWithComments) => {
      video.snippet.title = video.snippet.title.replace(
        '(Maggie audio fixed v1.2 final final)',
        ''
      )
      return video
    },
  },
  commentParsers: {
    'UgxyBv5bs7jg6X-FV1p4AaABAg': (comment) => {
      const { textDisplay } = comment.snippet.topLevelComment.snippet
      comment.snippet.topLevelComment.snippet.textDisplay = textDisplay
        .replace('1. Oo-de-lally', '1. Oo-de-lally 1:04')
        .replace('5. 7:19 Heartilation', '5. Heartilation 7:19')
        .replace(/\d+\.\s/g, '')
      return comment
    },
  },
  sortVideos: (videoA, videoB) => {
    const a = getVideoDate(videoA).toJSON()
    const b = getVideoDate(videoB).toJSON()
    return a < b ? 1 : a > b ? -1 : 0
  },
  omitVideoIds: [
    '4tOQRChKdgQ', // October 19 duplicate with bad audio
    'WmpOoCoMvIo', // May 10 extra video
  ],
  omitCommentIds: [
    'UgzHFsG1E5peX5zKYCJ4AaABAg', // June 22. No setlist but this comment has some timestamps
    'UgwXag5hnNlSNHEd-yZ4AaABAg', // June 22. No setlist but this comment has some timestamps
  ],
}

export default artist

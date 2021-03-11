import { Artist, VideoWithComments } from '../../types'

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

const parseTitleDate = (year: number, month: string, day: number): Date => {
  const d = new Date()
  d.setMonth(months.indexOf(month.toLowerCase()))
  d.setDate(day)
  d.setFullYear(year)
  return d
}

const titleParser = (title: string): string =>
  title.replace(/Live from Quarantine[\s-]+-?/i, '')

// Special case to sort these videos by their recorded date which is only
// captured in the title of the video I think. So this parses the date out of
// the title and then sorts on that
const dateParser = (video: VideoWithComments) => {
  const [, month, day] =
    dateRegex.exec(titleParser(video.snippet.title).toLowerCase()) || []

  const publishedYear = video.snippet.publishedAt.split('-')[0]

  // Doing some hacks here to special case video ids to the year they were performed.
  // Currently this is for times when the video was performed near the end of a calendar
  // year and then uploaded in the next year. There is no good way to detect this from a
  // single video, and would need to examine other videos near it in the list which isn't easy
  // to do with how the videos are run through the parsers in this file.
  const specialYear = {
    h6I2zx7Pju8: 2020,
  }[video.id]

  const year = specialYear || publishedYear

  if (!month || !day || !year) {
    throw new Error(
      `Could not find date when sorting for video: ${video.snippet.title}`
    )
  }

  return parseTitleDate(+year, month, +day).toJSON()
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
    PmJa6qlob0Q: {
      comments: `0:42 A Big Day for Grimley\n4:23 Oo-de-lally`,
    },
    JBFJwxSCtwk: {
      title: (title) =>
        title.replace('(Maggie audio fixed v1.2 final final)', ''),
    },
  },
  sortVideos: (videoA, videoB) => {
    const a = dateParser(videoA)
    const b = dateParser(videoB)
    return a < b ? 1 : a > b ? -1 : 0
  },
  omitVideoIds: [
    '4tOQRChKdgQ', // October 19 duplicate with bad audio
  ],
  omitCommentIds: [
    'UgzHFsG1E5peX5zKYCJ4AaABAg', // June 22. No setlist but this comment has some timestamps
  ],
}

export default artist

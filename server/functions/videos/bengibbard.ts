import { Artist } from '../../types'

const artist: Artist = {
  id: 'bengibbard',
  playlistId: 'PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  meta: {
    title: 'Ben Gibbard – Live From Home',
    description:
      '<a href="https://venmo.com/BenGibbardLiveFromHome" target="_blank">Venmo</a>',
  },
  titleParser: (video) =>
    video.snippet.title.replace(/Ben Gibbard: Live From Home \((.*)\)/i, '$1'),
  videoParsers: {
    Ei9xuVkbQuU: (video) => {
      video.snippet.title = '3/17/20'
      return video
    },
  },
  commentParsers: {
    Ugy0lRQEKiRUoRpOenN4AaABAg: (comment) => {
      comment.snippet.topLevelComment.snippet.textDisplay +=
        '\n16:55 special guest Rachel Demy\n28:40 Q&A'
      return comment
    },
  },
}

export default artist

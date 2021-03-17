import { Artist } from '../../types'

const artist: Artist = {
  id: 'bengibbard',
  playlistId: 'PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  meta: {
    title: 'Ben Gibbard – Live From Home',
    description:
      '<a href="https://venmo.com/BenGibbardLiveFromHome" target="_blank">Venmo</a>',
  },
  titleParser: (title) =>
    title.replace(/Ben Gibbard: Live From Home \((.*)\)/i, '$1'),
  videoParsers: {
    Ei9xuVkbQuU: { title: () => '3/17/20' },
  },
  commentParsers: {
    Ugy0lRQEKiRUoRpOenN4AaABAg: (text) =>
      text + '\n16:55 special guest Rachel Demy\n28:40 Q&A',
  },
}

export default artist

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
    'Hk-xqMKLyRo': {
      comments: `
        00:51 Me and Magdalena
        05:52 Underwater
        08:56 El Dorado
        13:25 Duncan where have you gone?
        16:55 special guest Rachel Demy
        21:39 Stable Song
        25:00 Summer Years
        28:40 Q&A
        38:20 Life in Quarantine
        42:47 St Swithin's Day
        47:36 I'm Building a Fire
      `,
    },
  },
  omitCommentIds: [
    'UgyA0JzCcn4gxF1ktmZ4AaABAg', // 3/22/20,
    'Ugwvw34H4WPb3AU9L1t4AaABAg', // 3/21/20
  ],
}

export default artist

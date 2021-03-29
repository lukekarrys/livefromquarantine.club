import { Artist } from '../../types'

const artist: Artist = {
  id: 'benfolds',
  playlistId: 'PLG507gy2-Kp8Vj66jnxn1AA0XFr1L_QXy',
  meta: {
    title: 'Ben Folds – Apartment Requests',
    description:
      '<a href="https://www.patreon.com/BenFolds" target="_blank">Patreon</a>',
  },
  titleParser: (video) =>
    video.snippet.title
      .split('-')[0]
      .replace(/\bw Ben Folds\b/gi, '')
      .replace(/\bBen Folds\b/gi, '')
      .replace(/\bFolds\b/gi, ''),
}

export default artist

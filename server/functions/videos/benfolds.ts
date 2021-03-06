import { Artist } from '../../types'

const artist: Artist = {
  id: 'benfolds',
  playlistId: 'PLG507gy2-Kp8Vj66jnxn1AA0XFr1L_QXy',
  meta: {
    title: 'Ben Folds – Apartment Requests',
    description:
      '<a href="https://www.patreon.com/BenFolds" target="_blank">Patreon</a>',
  },
  titleParser: (title) =>
    title
      .split('-')[0]
      .replace(/\bw Ben Folds\b/gi, '')
      .replace(/\bBen Folds\b/gi, '')
      .replace(/\bFolds\b/gi, ''),
  omitCommentIds: [
    'UgzBJFE06U9bR-ozNRx4AaABAg', // #9 Saturday Apartment Requests w Ben Folds
  ],
}

export default artist

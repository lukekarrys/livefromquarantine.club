module.exports = {
  parsers: {
    title: (title) =>
      title
        .split('-')[0]
        .replace(/\bw Ben Folds\b/gi, '')
        .replace(/\bBen Folds\b/gi, '')
        .replace(/\bFolds\b/gi, ''),
  },
  playlistId: 'PLG507gy2-Kp8Vj66jnxn1AA0XFr1L_QXy',
  id: 'benfolds',
  meta: {
    title: 'Ben Folds – Apartment Requests',
    description:
      '<a href="https://www.patreon.com/BenFolds" target="_blank">Patreon</a>',
  },
}

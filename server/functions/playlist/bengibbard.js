module.exports = {
  parsers: {
    title: (title) =>
      title.replace(/Ben Gibbard: Live From Home \((.*)\)/i, '$1').trim(),
  },
  playlistId: 'PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  id: 'bengibbard',
  meta: {
    title: 'Ben Gibbard – Live From Home',
    main:
      '<a href="https://venmo.com/BenGibbardLiveFromHome" target="_blank">Venmo</a>',
  },
}
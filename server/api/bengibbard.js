module.exports.parsers = {
  title: (title) =>
    title.replace(/Ben Gibbard: Live From Home \((.*)\)/i, '$1').trim(),
}

module.exports.meta = {
  title: 'Ben Gibbard – Live From Home',
  description: 'All the Ben Gibbard Live From Home songs',
  id: 'bengibbard',
  playlistId: 'PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  main:
    '<a href="https://venmo.com/BenGibbardLiveFromHome" target="_blank">Venmo: @BenGibbardLiveFromHome</a>',
}

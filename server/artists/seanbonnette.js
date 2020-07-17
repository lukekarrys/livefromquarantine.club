const assert = require('assert')

module.exports = {
  parsers: {
    title: (title) => title.replace(/Live from Quarantine[\s-]+-?/i, '').trim(),
    data: (videos) => {
      assert.ok(
        videos.some((v) => v.songs.some((s) => s.time.end && s.time.end > 0)),
        'Some songs have an end'
      )

      return videos
    },
  },
  playlistId: 'PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
  id: 'seanbonnette',
  meta: {
    title: 'Sean Bonnette – Live From Quarantine',
    main: [
      '<a href="http://www.patreon.com/ajjtheband" target="_blank">Patreon</a>',
      '<a href="https://venmo.com/bonnseanette" target="_blank">Venmo</a>',
      '<a href="https://paypal.me/bonnseanette" target="_blank">Paypal</a>',
      '<a href="https://cash.app/$bonnseanette" target="_blank">Cash App</a>',
      '<a href="http://shop.ajjtheband.com" target="_blank">Merch</a>',
    ].join(''),
  },
}

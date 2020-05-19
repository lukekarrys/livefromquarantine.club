const assert = require('assert')

module.exports.parsers = {
  title: (title) => title.replace(/Live from Quarantine\s+-?/i, '').trim(),
  data: (videos) => {
    assert.ok(
      videos.some((v) => v.songs.some((s) => s.time.end && s.time.end > 0)),
      'Some songs have an end'
    )

    return videos
  },
}

module.exports.meta = {
  title: 'Sean Bonnette – Live From Quarantine',
  description: 'All the Sean Bonnette Live From Quarantine songs',
  id: 'seanbonnette',
  playlistId: 'PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
  main: [
    '<a href="https://venmo.com/bonnseanette" target="_blank">Venmo: @bonnseanette</a>',
    '<a href="https://paypal.me/bonnseanette" target="_blank">Paypal: paypal.me/bonnseanette</a>',
    '<a href="https://cash.app/$bonnseanette" target="_blank">Cash App: $bonnseanette</a>',
    '<a href="http://shop.ajjtheband.com" target="_blank">Merch</a>',
  ].join(''),
}

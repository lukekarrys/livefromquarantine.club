const assert = require('assert')

module.exports.parsers = {
  title: (title) => title.replace(/Live from Quarantine\s+-?/i, '').trim(),
  data: (videos) => {
    // There's another one from this date with better quality
    const skipIds = ['w0-82S7RCic']
    const filteredVideos = videos.filter((video) => {
      return !skipIds.includes(video.id)
    })

    assert.ok(
      filteredVideos.some((v) =>
        v.songs.some((s) => s.time.end && s.time.end.match(/^\d+:\d+$/))
      ),
      'Some songs have an end'
    )

    return filteredVideos
  },
}

module.exports.meta = {
  title: 'Sean Bonnette – Live From Quarantine',
  description: 'All the Sean Bonnette Live From Quarantine songs',
  id: 'seanbonnette',
  playlistId: 'PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
  main: `
    <a href="https://venmo.com/bonnseanette" target="_blank">Venmo: @bonnseanette</a>
    <a href="https://paypal.me/bonnseanette" target="_blank">Paypal: paypal.me/bonnseanette</a>
    <a href="https://cash.app/$bonnseanette" target="_blank">Cash App: $bonnseanette</a>
    <a href="http://shop.ajjtheband.com" target="_blank">Merch</a>
  `,
}

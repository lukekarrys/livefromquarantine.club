const assert = require('assert')

const extraDescriptions = {
  'TGJjttNEvVI': `
    02:37 - Mega Guillotine 2020
    06:13 - Bold With Fire (Stephen Steinbrink / French Quarter)
    09:43 - You Got Served (Kind of Like Spitting / David Jerkovich / Novi Split) (Take 1)
    11:07 - You Got Served (Take 2)
    13:23 - Heartilation
    16:11 - Temple Grandin
    19:04 - Reincarnation (Roger Miller)
    21:04 - Brave As A Noun
  `
}

// There's another one from this date with better quality
const skipIds = ['w0-82S7RCic']

const getSongsFromText = (text) => {
  const descWithSet = text.split(/7:30(?: PM)?(?: (?:Pacific|PST))/i)[1] || text
  const descLines = descWithSet.split('\n')
  const songLines = descLines.filter((line) => /\d+:\d+/.test(line))
  return songLines.map((line) => {
    const [match, start, end] = line.match(/(\d+:\d+)(?: ?- ?(\d+:\d+))?/)
    const name = line.replace(match, '')
    return {
      name: name.trim().replace(/^-/, '').replace(/-$/, '').trim(),
      time: {
        start,
        end
      }
    }
  })
}

module.exports.parse = (items) => {
  const data = items.map((r) => {
    const { title, description, resourceId: { videoId } } = r.snippet

    let songs = null

    if (/\d+:\d+/.test(description)) {
      songs = getSongsFromText(description)
    } else if (extraDescriptions[videoId]) {
      songs = getSongsFromText(extraDescriptions[videoId])
    }

    return {
      title: title.replace(/Live from Quarantine\s+-?/i, '').trim(),
      id: videoId,
      songs
    }
  }).filter((video) => {
    return !skipIds.includes(video.id)
  }).filter((video, index, videos) => {
    return videos.findIndex(v => v.id === video.id) === index;
  })

  return data
}

module.exports.validate = (data) => {
  assert.ok(data.some(v => v.songs.some(s => s.time.end && s.time.end.match(/^\d+:\d+$/))), 'Some songs have an end')
}

module.exports.meta = {
  title: 'AJJ Live From Quarantine',
  description: 'All the AJJ songs live From quarantine',
  id: 'ajj',
  main: `
    <h2>AJJ – Live from Quarantine<br/>Pick a song to start<br/>Then keep picking to add songs to your queue</h2><br/>
    <a href="https://venmo.com/bonnseanette" target="_blank">Venmo: @bonnseanette</a>
    <a href="https://paypal.me/bonnseanette" target="_blank">Paypal: paypal.me/bonnseanette</a>
    <a href="https://cash.app/$bonnseanette" target="_blank">Cash App: $bonnseanette</a>
    <a href="http://shop.ajjtheband.com" target="_blank">Merch</a>
  `
}

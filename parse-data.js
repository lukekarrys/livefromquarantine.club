const fs = require('fs')
const assert = require('assert')
const raw = require('./raw.json')

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

const data = raw.items.map((r) => {
  const { title, publishedAt, description, resourceId: { videoId } } = r.snippet
  const hasTimestamp = /\d+:\d+/.test(r.snippet.description)
  let songs = null

  if (hasTimestamp) {
    songs = getSongsFromText(description)
  } else if (extraDescriptions[videoId]) {
    songs = getSongsFromText(extraDescriptions[videoId])
  }

  return {
    title,
    id: videoId,
    songs
  }
}).filter((video) => {
  return !skipIds.includes(video.id)
}).filter((video, index, videos) => {
  return videos.findIndex(v => v.id === video.id) === index;
})

assert.ok(data.every(v => v.title), 'Every video has a title')
assert.ok(data.every(v => v.id), 'Every video has an id')
assert.ok(data.every(v => v.songs), 'Every video has songs')
assert.ok(data.every(v => v.songs.every(s => s.name && s.time.start && s.time.start.match(/^\d+:\d+$/))), 'Every song has a name and time')
assert.ok(data.every(v => v.songs.every(s => s.name && s.time.start)), 'Every song has a name and time')
assert.ok(data.some(v => v.songs.some(s => s.time.end && s.time.end.match(/^\d+:\d+$/))), 'Some songs have an end')

console.log(`window.__DATA=${JSON.stringify(data)}`)

const fs = require('fs')
const raw = require('./raw.json')

const data = raw.items.map((r) => {
  const {title, publishedAt, description, resourceId} = r.snippet
  const hasTimestamp = /\d+:\d+/.test(r.snippet.description)
  let songs = null

  if (hasTimestamp) {
    const descWithSet = description.split(/7:30(?: PM)?(?: (?:Pacific|PST))/i)[1] || description
    const descLines = descWithSet.split('\n')
    const songLines = descLines.filter((line) => /\d+:\d+/.test(line))
    songs = songLines.map((line) => {
      const [match, start, __, end] = line.match(/(\d+:\d+)( ?- ?(\d+:\d+))?/)
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

  return {
    title,
    publishedAt,
    id: resourceId.videoId,
    songs
  }
}).sort((a, b) => a.publishedAt - b.publishedAt).map((v) => ({
  title: v.title,
  id: v.id,
  songs: v.songs
}))

fs.writeFileSync('./public/parsed.js', `window.__DATA=${JSON.stringify(data)}`)
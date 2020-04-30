require('dotenv').config()

const fs = require('fs').promises
const path = require('path')
const axios = require('axios')

const apiUrl = `https://www.googleapis.com/youtube/v3`

const commentUrl = (id, key) => {
  const url = new URL(`${apiUrl}/commentThreads`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('order', 'relevance')
  url.searchParams.set('textFormat', 'plainText')
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('videoId', id)
  url.searchParams.set('key', key)
  return url.toString()
}

const playlistUrl = (id, key) => {
  const url = new URL(`${apiUrl}/playlistItems`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('playlistId', id)
  url.searchParams.set('key', key)
  return url.toString()
}

const sortKeys = (obj) => {
  const keys = Object.keys(obj)
  keys.sort()
  return keys.reduce((acc, k) => {
    acc[k] = obj[k]
    return acc
  }, {})
}

const normalizeData = (d) =>
  sortKeys(
    JSON.parse(
      JSON.stringify(d, (key, value) => {
        if (key === 'etag') return undefined
        if (value && !Array.isArray(value) && typeof value === 'object') {
          return sortKeys(value)
        }
        if (key === 'updatedAt' || key === 'publishedAt') {
          return new Date(value).toJSON()
        }
        return value
      })
    )
  )

const getVideosAndComments = async (artist, key) => {
  const videosResp = await axios.get(playlistUrl(artist.meta.playlistId, key))
  const videos = normalizeData(videosResp.data)

  const videosComments = await Promise.all(
    videos.items.map((video) =>
      axios
        .get(commentUrl(video.snippet.resourceId.videoId, key))
        .then((r) => normalizeData(r.data))
    )
  )

  const commentsByVideoId = videosComments.reduce(
    (acc, videoComments, index) => {
      acc[videos.items[index].snippet.resourceId.videoId] = videoComments
      return acc
    },
    {}
  )

  return {
    videos,
    comments: commentsByVideoId,
  }
}

const writeFile = async (artist, resp) => {
  await fs.writeFile(
    path.join(__dirname, `${artist.meta.id}.json`),
    JSON.stringify(resp, null, 2)
  )
}

const getArtist = async (artistKey) => {
  const artist = require(`../build/${artistKey}`)

  if (!artist) {
    throw new Error(`Invalid artistKey: ${artistKey}`)
  }

  const { API_KEY } = process.env
  const resp = await getVideosAndComments(artist, API_KEY)
  await writeFile(artist, resp)
}

const main = async (...artists) => {
  return Promise.all(
    artists.map((id) =>
      getArtist(id)
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

main(...process.argv.slice(2).flatMap((v) => v.split(',')))
  .then(console.log)
  .catch(console.error)

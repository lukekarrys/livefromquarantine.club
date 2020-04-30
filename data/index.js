const fs = require('fs').promises
const path = require('path')
const axios = require('axios')

const commentUrl =
  'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&order=relevance&textFormat=plainText&videoId='

const playlistUrl =
  'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId='

const getEnvVars = async () =>
  (await fs.readFile('.env'))
    .toString()
    .split('\n')
    .map((l) => l.split('='))
    .reduce((acc, item) => {
      acc[item[0]] = item[1]
      return acc
    }, {})

const getVideosAndComments = async (artist, key) => {
  const videosResp = await axios.get(
    `${playlistUrl}${artist.meta.playlistId}&key=${key}`
  )
  const videos = videosResp.data

  const videosComments = await Promise.all(
    videos.items.map((video) =>
      axios
        .get(`${commentUrl}${video.snippet.resourceId.videoId}&key=${key}`)
        .then((r) => r.data)
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

  const { API_KEY } = await getEnvVars()
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
  ).then((res) => {
    const errors = res.filter((r) => !r.ok)
    if (errors.length) {
      throw new Error(
        `Error building artists: ${errors
          .map((e) => e.id)
          .join(',')}\n\n${errors.map((e) => e.error.message).join('\n\n')}`
      )
    } else {
      return res
    }
  })
}

main(...process.argv.slice(2).flatMap((v) => v.split(',')))
  .then(console.log)
  .catch(console.error)

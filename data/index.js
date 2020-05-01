require('dotenv').config()

const fs = require('fs').promises
const path = require('path')
const axios = require('axios')
const prettier = require('prettier')
const { isCommentMaybeSetlist } = require('../build/parse')

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
        if (
          [
            'etag',
            'nextPageToken',
            'likeCount',
            'totalReplyCount',
            'position',
            'canReply',
            'isPublic',
            'canRate',
            'pageInfo',
            'nextPageToken',
            'previousPageToken'
          ].includes(key)
        ) {
          return undefined
        }
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
  
const getPaginatedVideos = async (id, key, token, previousItems) => {
  const resp = await axios.get(playlistUrl(id, key, token))
  const {items, nextPageToken } = resp.data
  const newItems = [...previousItems, ...items]
  if (nextPageToken) {
    return await getPaginatedVideos(id, key, nextPageToken, newItems)
  }
  return {
  ...resp,
  data: {
  ...resp.data,
  items: newItems
  }
  }
}

const getVideosAndComments = async (artist, key) => {
  const videosResp = await getPaginatedVideos(artist.meta.playlistId, key)
  const videos = normalizeData(videosResp.data)

  const videosComments = await Promise.all(
    videos.items.map((video) =>
      axios
        .get(commentUrl(video.snippet.resourceId.videoId, key))
        .then((resp) => {
          return Object.assign(resp.data, {
            items: resp.data.items
              .filter((comment) =>
                isCommentMaybeSetlist(
                  comment.snippet.topLevelComment.snippet.textDisplay
                )
              )
              .sort(
                (a, b) =>
                  a.snippet.topLevelComment.updatedAt -
                  b.snippet.topLevelComment.updatedAt
              ),
          })
        })
        .then((r) => normalizeData(r))
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
  const prettierOptions = await prettier.resolveConfig(__dirname)
  await fs.writeFile(
    path.join(__dirname, `${artist.meta.id}.json`),
    prettier.format(JSON.stringify(resp, null, 2), {
      parser: 'json',
      ...prettierOptions,
    })
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
  if (!artists.length) throw new Error('No artists')
  return Promise.all(
    artists.map((id) =>
      getArtist(id)
        .then(() => ({ id, ok: true }))
        .catch((error) => ({ id, ok: false, error }))
    )
  )
}

main(...process.argv.slice(2).flatMap((v) => v.split(',')))
  .then((res) => {
    console.log(res)
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

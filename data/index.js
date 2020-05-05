require('dotenv').config()

const fs = require('fs').promises
const path = require('path')
const axios = require('axios')
const prettier = require('prettier')
const { isCommentMaybeSetlist } = require('../build/parse')
const config = require('../config')

const { API_KEY } = process.env

const apiUrl = `https://www.googleapis.com/youtube/v3`
const hideKey = (str) => str.replace(API_KEY, 'X'.repeat(3)).replace(apiUrl, '')

const commentUrl = (id, key) => {
  const url = new URL(`${apiUrl}/commentThreads`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('order', 'relevance')
  url.searchParams.set('textFormat', 'plainText')
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('videoId', id)
  url.searchParams.set('key', key)
  return url.toString()
}

const playlistUrl = (id, key, pageToken) => {
  const url = new URL(`${apiUrl}/playlistItems`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('playlistId', id)
  url.searchParams.set('key', key)
  if (pageToken) url.searchParams.set('pageToken', pageToken)
  return url.toString()
}

const videosUrl = (id, parts, key) => {
  const url = new URL(`${apiUrl}/videos`, apiUrl)
  url.searchParams.set('part', `liveStreamingDetails,${parts.join(',')}`)
  url.searchParams.set('id', id)
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
            'prevPageToken',
            'caption',
            'contentRating',
            'definition',
            'dimension',
            'licensedContent',
            'projection',
            'regionRestriction',
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

const getPaginatedVideos = async (id, key, pageToken, previousItems = []) => {
  const url = playlistUrl(id, key, pageToken)
  console.log(`Fetching url: ${hideKey(url)}`)

  const resp = await axios.get(url)
  let { items, nextPageToken } = resp.data

  const detailParts = ['contentDetails']
  const videosDetailsResp = await axios.get(
    videosUrl(
      items.map((v) => v.snippet.resourceId.videoId).join(','),
      detailParts,
      key
    )
  )
  const { items: videoItems } = videosDetailsResp.data

  const filteredItems = items
    .filter((video, index) => {
      const videoDetails = videoItems[index]
      if (videoDetails.liveStreamingDetails) {
        return !!videoDetails.liveStreamingDetails.actualEndTime
      }
      return true
    })
    .map((video, index) => {
      const videoDetails = videoItems[index]
      detailParts.forEach((detailPart) => {
        Object.assign(video, {
          [detailPart]: videoDetails[detailPart],
        })
      })
      return video
    })

  const newItems = [...previousItems, ...filteredItems]

  if (nextPageToken) {
    return await getPaginatedVideos(id, key, nextPageToken, newItems)
  }

  return {
    ...resp,
    data: {
      ...resp.data,
      items: newItems,
    },
  }
}

const getVideosAndComments = async (artist, key) => {
  const videosResp = await getPaginatedVideos(artist.meta.playlistId, key)
  const videos = normalizeData(videosResp.data)

  await Promise.all(
    videos.items.map(async (video) => {
      const url = commentUrl(video.snippet.resourceId.videoId, key)
      console.log(`Fetching url: ${hideKey(url)}`)

      video.comments = await axios
        .get(url)
        .then((resp) => {
          return Object.assign(resp.data, {
            items: resp.data.items
              .filter((comment) =>
                isCommentMaybeSetlist(
                  comment.snippet.topLevelComment.snippet.textDisplay
                )
              )
              // Sort by likeCount before removing it. YouTube returns comments
              // by "relevance" but likeCount is a better indicator of timestamps I think
              .sort((a, b) => a.snippet.likeCount - b.snippet.likeCount),
          })
        })
        .then((r) => normalizeData(r))
    })
  )

  return {
    videos,
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

const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
main(...(cliArtists.length ? cliArtists : config.artists))
  .then((res) => {
    console.log(hideKey(JSON.stringify(res, null, 2)))
    if (res.some((r) => !r.ok)) {
      throw new Error('Data error')
    }
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const fs = require('fs').promises
const axios = require('axios')
const prettier = require('prettier')
const duration = require('iso8601-duration')
const { isCommentMaybeSetlist } = require('../api/parse')
const config = require('../../config')

const { API_KEY } = process.env

const apiUrl = `https://www.googleapis.com/youtube/v3`
const hideKey = (str) => str.replace(API_KEY, 'X'.repeat(3)).replace(apiUrl, '')

const omitCommentIds = [
  'UgyA0JzCcn4gxF1ktmZ4AaABAg',
  'UgzY1loB0NOTUSY_jgR4AaABAg',
]
const blessCommentIds = ['UgzyR6a6B-Czl4pI5ZN4AaABAg']

const get = (url) => {
  return axios.get(url)
}

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
            'authorChannelId',
            'authorChannelUrl',
            'authorDisplayName',
            'authorProfileImageUrl',
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
        if (key === 'duration') {
          // 0 length durations seem to change between seconds (0S) and days (0D)
          // sometimes so in order to reduce data churn in diffs just store as seconds
          return duration.toSeconds(duration.parse(value))
        }
        return value
      })
    )
  )

const getPaginatedVideos = async (id, key, pageToken, previousItems = []) => {
  const url = playlistUrl(id, key, pageToken)

  const resp = await get(url)
  const { items, nextPageToken } = resp.data

  const nonPrivateItems = items.filter((v) => {
    return (
      v.snippet.title !== 'Private video' &&
      v.snippet.description !== 'This video is private.'
    )
  })

  const detailParts = ['contentDetails']
  const videosDetailsResp = await get(
    videosUrl(
      nonPrivateItems.map((v) => v.snippet.resourceId.videoId).join(','),
      detailParts,
      key
    )
  )
  const { items: videoItems } = videosDetailsResp.data
  const findVideoDetails = (video) =>
    videoItems.find((v) => v.id === video.snippet.resourceId.videoId)

  const filteredItems = nonPrivateItems
    .filter((video) => {
      const videoDetails = findVideoDetails(video)
      if (videoDetails.liveStreamingDetails) {
        return videoDetails.liveStreamingDetails.actualEndTime
      }
      return true
    })
    .map((video) => {
      const videoDetails = findVideoDetails(video)
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
      video.comments = await get(url)
        .then((resp) => {
          return Object.assign(resp.data, {
            items: resp.data.items
              .filter(
                (comment) =>
                  isCommentMaybeSetlist(
                    comment.snippet.topLevelComment.snippet.textDisplay
                  ) && !omitCommentIds.includes(comment.id)
              )
              // Sort by likeCount before removing it. YouTube returns comments
              // by "relevance" but likeCount is a better indicator of timestamps I think
              .sort((a, b) => {
                const aIsBlessed = blessCommentIds.includes(a.id)
                const bIsBlessed = blessCommentIds.includes(b.id)
                if (aIsBlessed || bIsBlessed) return aIsBlessed ? -1 : 1
                return a.snippet.likeCount - b.snippet.likeCount
              }),
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
  const artist = require(`../api/${artistKey}`)

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
        .catch((error) => ({
          id,
          ok: false,
          error,
          response: error.response.data,
        }))
    )
  )
}

const cliArtists = process.argv.slice(2).flatMap((v) => v.split(','))
main(...(cliArtists.length ? cliArtists : config.artists.map((a) => a.id)))
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

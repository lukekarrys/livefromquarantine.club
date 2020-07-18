const axios = require('axios')
const duration = require('iso8601-duration')
const { findSetlist } = require('./parse')

const apiUrl = `https://www.googleapis.com/youtube/v3`

const omitCommentIds = [
  'UgyA0JzCcn4gxF1ktmZ4AaABAg', // Ben Gibbard: Live From Home (3/22/20)
]

const blessCommentIds = [
  'UgzyR6a6B-Czl4pI5ZN4AaABAg', // Ben Gibbard: Live From Home (3/22/20)
]

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

const playlistItemsUrl = (id, key, pageToken) => {
  const url = new URL(`${apiUrl}/playlistItems`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', '50')
  url.searchParams.set('playlistId', id)
  url.searchParams.set('key', key)
  if (pageToken) url.searchParams.set('pageToken', pageToken)
  return url.toString()
}

const playlistUrl = (id, key) => {
  const url = new URL(`${apiUrl}/playlists`, apiUrl)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('id', id)
  url.searchParams.set('key', key)
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
  const url = playlistItemsUrl(id, key, pageToken)

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

const getPlaylistData = async (id, key) => {
  const playlistResp = await get(playlistUrl(id, key))
  const playlist = playlistResp.data.items[0]

  if (!playlist) {
    throw new Error('Playlist could not be found')
  }

  const { title, description } = playlist.snippet

  return {
    title,
    description,
  }
}

const getFullPlaylistData = async (playlistId, key) => {
  const playlistMeta = await getPlaylistData(playlistId, key)
  const videosResp = await getPaginatedVideos(playlistId, key)
  const videos = normalizeData(videosResp.data)

  await Promise.all(
    videos.items.map(async (video) => {
      const { description, resourceId } = video.snippet

      if (findSetlist(description)) {
        video.comments = { items: [] }
        return
      }

      video.comments = await get(commentUrl(resourceId.videoId, key))
        .then((resp) => {
          return Object.assign(resp.data, {
            items: resp.data.items
              .filter(
                (comment) =>
                  findSetlist(
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
    meta: playlistMeta,
    videos,
  }
}

module.exports = getFullPlaylistData

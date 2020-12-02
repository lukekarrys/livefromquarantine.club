const axios = require('axios')
const duration = require('iso8601-duration')
const findSetlist = require('./find-setlist')

const omitCommentIds = [
  'UgyA0JzCcn4gxF1ktmZ4AaABAg', // Ben Gibbard: Live From Home (3/22/20),
  'UgzBJFE06U9bR-ozNRx4AaABAg', // #9 Saturday Apartment Requests w Ben Folds
]

const blessCommentIds = []

const get = ({ url, params = {}, headers = {}, token }) => {
  const axiosRequest = {
    baseURL: `https://www.googleapis.com/youtube/v3`,
    url,
    params,
    headers,
  }

  if (token.key) {
    axiosRequest.params.key = token.key
  } else if (token.accessToken) {
    axiosRequest.headers.Authorization = `Bearer ${token.accessToken}`
  }

  return axios.request(axiosRequest)
}

const createAxiosError = (response, message, status, statusText) => {
  const error = new Error(message)
  response.status = status
  response.statusText = statusText
  response.data.error = { message: error.message }
  error.response = response
  return error
}

const commentUrl = (id, token, pageToken) => ({
  url: '/commentThreads',
  params: Object.assign(
    {
      part: 'snippet',
      order: 'relevance',
      textFormat: 'plainText',
      maxResults: '100',
      videoId: id,
    },
    pageToken ? { pageToken } : {}
  ),
  token,
})

const playlistItemsUrl = (id, token, pageToken) => ({
  url: '/playlistItems',
  params: Object.assign(
    {
      part: 'snippet',
      maxResults: '50',
      playlistId: id,
    },
    pageToken ? { pageToken } : {}
  ),
  token,
})

const playlistUrl = (id, token) => ({
  url: '/playlists',
  params: {
    part: 'snippet',
    maxResults: '1',
    id: id,
  },
  token,
})

const videosUrl = (id, parts, token) => ({
  url: '/videos',
  params: {
    part: parts.join(','),
    id: id,
  },
  token,
})

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
            'liveStreamingDetails',
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

const isVideoPrivate = (video) =>
  video.snippet.title === 'Private video' &&
  video.snippet.description === 'This video is private.'

const isVideoFuture = (video) =>
  video.liveStreamingDetails ? !video.liveStreamingDetails.actualEndTime : false

const getPaginatedVideosFromPlaylist = async (
  id,
  token,
  pageToken,
  previousItems = []
) => {
  const resp = await get(playlistItemsUrl(id, token, pageToken))

  const { items, nextPageToken } = resp.data
  const publicVideos = items.filter((v) => !isVideoPrivate(v))

  // Playlist can't include content or livestream details so we need to
  // fetch those separately
  const videosDetailsResp = await get(
    videosUrl(
      publicVideos.map((v) => v.snippet.resourceId.videoId).join(','),
      ['contentDetails', 'liveStreamingDetails'],
      token
    )
  )

  const filteredItems = videosDetailsResp.data.items
    .filter((video) => !isVideoFuture(video))
    .map((video, index) => {
      // We save some API quota by reusing the snippet from the playlist call
      video.snippet = publicVideos[index].snippet
      return video
    })

  const newItems = [...previousItems, ...filteredItems]

  if (nextPageToken) {
    return await getPaginatedVideosFromPlaylist(
      id,
      token,
      nextPageToken,
      newItems
    )
  }

  return {
    ...resp,
    data: {
      ...resp.data,
      items: newItems,
    },
  }
}

const getPaginatedComments = async (
  id,
  token,
  pageToken,
  previousItems = []
) => {
  const resp = await get(commentUrl(id, token, pageToken))

  const { items, nextPageToken } = resp.data

  const newItems = [...previousItems, ...items]

  if (nextPageToken && newItems.length < 300) {
    return await getPaginatedComments(id, token, nextPageToken, newItems)
  }

  return {
    ...resp,
    data: {
      ...resp.data,
      items: newItems,
    },
  }
}

const getPlaylistData = async (id, token) => {
  const response = await get(playlistUrl(id, token))

  if (!response.data.pageInfo.totalResults) {
    throw createAxiosError(
      response,
      'Playlist could not be found',
      404,
      'Not Found'
    )
  }

  const { title, description } = response.data.items[0].snippet

  return {
    title,
    description,
  }
}

const getVideoSetlist = async (video, token) => {
  const {
    id: videoId,
    snippet: { description },
  } = video

  if (findSetlist(description)) {
    video.comments = { items: [] }
    return
  }

  // Get paginated comments because sometimes the YouTube API doesn't return comments
  // that are top on the website even when asking it to sort them by relevance. This is not
  // an idea solution and could break on videos with many thousands of comments but none of
  // the preloaded videos are there yet.
  video.comments = await getPaginatedComments(videoId, token)
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
            return (
              b.snippet.topLevelComment.snippet.likeCount -
              a.snippet.topLevelComment.snippet.likeCount
            )
          }),
      })
    })
    .then((r) => normalizeData(r))
}

const getFullVideoData = async (videoId, token) => {
  const response = await get(
    videosUrl(
      videoId,
      ['contentDetails', 'snippet', 'liveStreamingDetails'],
      token
    )
  )

  const video = response.data.items[0]

  if (!video || isVideoPrivate(video) || isVideoFuture(video)) {
    throw createAxiosError(
      response,
      'Video could not be found',
      404,
      'Not Found'
    )
  }

  const videos = normalizeData(response.data)
  await Promise.all(videos.items.map((video) => getVideoSetlist(video, token)))

  return {
    meta: {
      title: videos.items[0].snippet.title,
    },
    videos,
  }
}

const getFullPlaylistData = async (playlistId, token) => {
  const [playlistMeta, videosResp] = await Promise.all([
    getPlaylistData(playlistId, token),
    getPaginatedVideosFromPlaylist(playlistId, token),
  ])

  const videos = normalizeData(videosResp.data)
  await Promise.all(videos.items.map((video) => getVideoSetlist(video, token)))

  return {
    meta: playlistMeta,
    videos,
  }
}

module.exports.getVideo = getFullVideoData
module.exports.getPlaylist = getFullPlaylistData

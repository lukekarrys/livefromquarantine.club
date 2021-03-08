import findSetlist from './find-setlist'
import * as youtube from './youtube'
import { Token, PreloadedData, YouTube } from '../types'

const isVideoPrivate = (video: YouTube.PlaylistItem | YouTube.Video) =>
  video.snippet.title === 'Private video' &&
  video.snippet.description === 'This video is private.'

const isVideoFuture = (video: YouTube.Video) =>
  video.liveStreamingDetails ? !video.liveStreamingDetails.actualEndTime : false

const getPaginatedVideosFromPlaylist = async (
  id: string,
  token: Token,
  pageToken?: string,
  previousItems: YouTube.Video[] = []
): Promise<YouTube.Video[]> => {
  const { items, nextPageToken } = await youtube.playlistItems(
    id,
    token,
    pageToken
  )

  const publicPlaylistVideos = items.filter((v) => !isVideoPrivate(v))

  const publicVideoIds = publicPlaylistVideos
    .map((v) => v.snippet.resourceId.videoId)
    .filter(Boolean)
    .join(',')

  // Playlist can't include content or livestream details so we need to
  // fetch those separately
  const { items: videoItems = [] } = await youtube.video(
    publicVideoIds,
    ['contentDetails', 'liveStreamingDetails', 'snippet'],
    token
  )

  const filteredItems = videoItems.filter((video) => !isVideoFuture(video))

  const newItems = [...previousItems, ...filteredItems]

  if (nextPageToken) {
    return await getPaginatedVideosFromPlaylist(
      id,
      token,
      nextPageToken,
      newItems
    )
  }

  return newItems
}

const getPaginatedComments = async (
  id: string,
  token: Token,
  pageToken?: string,
  previousItems: YouTube.CommentThread[] = []
): Promise<YouTube.CommentThread[]> => {
  const { items, nextPageToken } = await youtube.commentThreads(
    id,
    token,
    pageToken
  )

  const setlistComments = items
    .filter((comment) =>
      findSetlist(comment.snippet.topLevelComment.snippet.textDisplay)
    )
    // Sort by likeCount before removing it. YouTube returns comments
    // by "relevance" but likeCount is a better indicator of timestamps I think
    .sort((a, b) => {
      return (
        b.snippet.topLevelComment.snippet.likeCount -
        a.snippet.topLevelComment.snippet.likeCount
      )
    })

  const newItems = [...previousItems, ...setlistComments]

  // Get paginated comments because sometimes the YouTube API doesn't return comments
  // that are top on the website even when asking it to sort them by relevance. This is not
  // an ideal solution and could sill return nothing on videos with many thousands of comments
  // but none of the preloaded videos are there yet.
  if (nextPageToken && newItems.length < 300) {
    return await getPaginatedComments(id, token, nextPageToken, newItems)
  }

  return newItems
}

const getPlaylistData = async (
  id: string,
  token: Token
): Promise<YouTube.Playlist> => {
  const {
    items: [playlist],
  } = await youtube.playlist(id, token)

  if (!playlist) {
    throw new youtube.YouTubeError('Playlist could not be found', 404)
  }

  return playlist
}

const getFullVideoData = async (
  videoId: string,
  token: Token
): Promise<PreloadedData> => {
  const {
    items: [video],
  } = await youtube.video(
    videoId,
    ['contentDetails', 'snippet', 'liveStreamingDetails'],
    token
  )

  const noVideo = !video
  const isPrivate = isVideoPrivate(video)
  const isFuture = isVideoFuture(video)

  if (!video || isPrivate || isFuture) {
    throw new youtube.YouTubeError(
      'Video could not be found',
      404,
      `Video could not be found due to the following: ${JSON.stringify({
        noVideo,
        isPrivate,
        isFuture,
      })}`
    )
  }

  const comments = await getPaginatedComments(video.id, token)

  return {
    meta: {
      title: video.snippet.title,
    },
    videos: [
      youtube.normalizeVideo({
        ...video,
        comments,
      }),
    ],
  }
}

const getFullPlaylistData = async (
  playlistId: string,
  token: Token
): Promise<PreloadedData> => {
  const [playlist, videos] = await Promise.all([
    getPlaylistData(playlistId, token),
    getPaginatedVideosFromPlaylist(playlistId, token),
  ])

  const comments = await Promise.all(
    videos.map((video) => getPaginatedComments(video.id, token))
  )

  return {
    meta: {
      title: playlist.snippet.title,
      description: playlist.snippet.description,
    },
    videos: videos.map((video, index) =>
      youtube.normalizeVideo({
        ...video,
        comments: comments[index],
      })
    ),
  }
}

export const getVideo = getFullVideoData
export const getPlaylist = getFullPlaylistData

import duration from 'iso8601-duration'
import { VideoWithComments, YouTube } from '../types'

const normalizeVideo = (
  video: YouTube.Video & {
    comments: YouTube.CommentThread[]
  }
): VideoWithComments => {
  return {
    contentDetails: {
      duration: duration.toSeconds(
        duration.parse(video.contentDetails.duration)
      ),
    },
    id: video.id,
    snippet: {
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails,
    },
    comments: video.comments.map((comment) => ({
      id: comment.id,
      snippet: {
        videoId: comment.snippet.videoId,
        topLevelComment: {
          snippet: {
            textDisplay: comment.snippet.topLevelComment.snippet.textDisplay,
            publishedAt: new Date(
              comment.snippet.topLevelComment.snippet.publishedAt
            ).toJSON(),
            updatedAt: new Date(
              comment.snippet.topLevelComment.snippet.updatedAt
            ).toJSON(),
          },
        },
      },
    })),
  }
}

export default normalizeVideo

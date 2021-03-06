import duration from 'iso8601-duration'

const sortKeys = <T extends { [key: string]: unknown }>(obj: T): T => {
  const ks = Object.keys(obj) as (keyof T)[]
  ks.sort()
  return ks.reduce((acc, k) => {
    acc[k] = obj[k]
    return acc
  }, {} as T)
}

export type NormalizedData<T> = Omit<
  T,
  | 'etag'
  | 'nextPageToken'
  | 'likeCount'
  | 'totalReplyCount'
  | 'position'
  | 'canReply'
  | 'isPublic'
  | 'canRate'
  | 'pageInfo'
  | 'nextPageToken'
  | 'prevPageToken'
  | 'caption'
  | 'contentRating'
  | 'definition'
  | 'dimension'
  | 'licensedContent'
  | 'projection'
  | 'regionRestriction'
  | 'authorChannelId'
  | 'authorChannelUrl'
  | 'authorDisplayName'
  | 'authorProfileImageUrl'
  | 'liveStreamingDetails'
>

const normalizeData = <T extends { [key: string]: unknown }>(
  d: T
): NormalizedData<T> =>
  sortKeys<NormalizedData<T>>(
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
          return sortKeys<T>(value)
        }
        if (key === 'updatedAt' || key === 'publishedAt') {
          return new Date(value).toJSON()
        }
        if (key === 'duration') {
          // 0 length durations seem to change between seconds (0S) and days (0D)
          // sometimes so in order to reduce data churn in diffs just store as seconds
          return duration.toSeconds(duration.parse(value))
        }
        return value as unknown
      })
    )
  )

export default normalizeData

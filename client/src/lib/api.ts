import {
  Track,
  Videos,
  Tracks,
  VideoId,
  TrackId,
  ArtistMeta,
  ArtistId,
} from '../types'
import artists from '../../artists.json'

interface NormalizedData {
  videos: Videos
  tracks: Tracks
  meta: ArtistMeta
}

interface ApiSong {
  name: string
  time: {
    start: number
    end?: number
  }
}

interface ApiVideo {
  title: string
  id: VideoId
  duration: number
  songs: ApiSong[]
}

interface ApiData {
  meta: ArtistMeta
  data: ApiVideo[]
}

const videoToTrack = (video: ApiVideo): Track => ({
  id: video.id,
  videoId: video.id,
  title: video.title,
  start: 0,
  end: video.duration,
  duration: video.duration,
  isSong: false,
})

const videoSongToTrack = ({
  video,
  song,
  index,
}: {
  video: ApiVideo
  song: ApiSong
  index: number
}): Track => {
  const start = song.time.start
  const end =
    song.time.end ?? video.songs[index + 1]?.time.start ?? video.duration
  return {
    id: `${video.id}-${song.time.start}` as TrackId,
    videoId: video.id,
    title: [video.title, song.name],
    start,
    end,
    duration: end - start,
    isSong: true,
  }
}

const normalizeData = ({ meta, data: videos }: ApiData): NormalizedData => {
  const resp: NormalizedData = { videos: [], tracks: [], meta }

  videos.forEach((video) => {
    const videoTracks = []

    videoTracks.push(videoToTrack(video))
    video.songs.forEach((song, index) => {
      videoTracks.push(videoSongToTrack({ video, song, index }))
    })

    resp.videos.push({
      title: video.title,
      id: video.id as VideoId,
      duration: video.duration,
      tracks: videoTracks,
    })
    resp.tracks.push(...videoTracks)
  })

  return resp
}

const preloadedArtistIds = artists.map((artist) => artist.id)

const fetchUrl = (id: ArtistId): string => {
  // In dev mode everything gets loaded through the local API.
  // In production, non-preloaded artists get loaded on demand
  // a netlify function call. Preloaded artists are moved to
  // /public/api/id.json during build and are fetched from there.
  if (
    process.env.NODE_ENV === 'production' &&
    !preloadedArtistIds.includes(id)
  ) {
    return `/.netlify/functions/playlist?id=${id}`
  } else {
    return `/preloaded/${id}.json`
  }
}

const fetchData = (id: ArtistId): Promise<NormalizedData> =>
  fetch(fetchUrl(id)).then(async (resp) => {
    const data = await resp.json()
    if (resp.ok) {
      return normalizeData(data)
    } else {
      throw new Error(
        data.error || resp.statusText || 'An unknown error occurred'
      )
    }
  })

export default fetchData

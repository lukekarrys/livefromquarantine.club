import {
  Track,
  Videos,
  Tracks,
  VideoId,
  TrackId,
  ArtistMeta,
  ArtistId,
} from '../types'
import { artists } from '../../../config.json'

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
  if (process.env.NODE_ENV === 'production') {
    return preloadedArtistIds.includes(id)
      ? `/api/${id}.json`
      : `/.netlify/functions/playlist?id=${id}`
  } else {
    return `/api/${id}.json`
  }
}

const fetchData = (id: ArtistId): Promise<NormalizedData> =>
  fetch(fetchUrl(id)).then(async (resp) => {
    if (resp.ok) {
      const videos = await resp.json()
      return normalizeData(videos)
    } else {
      throw new Error(`${resp.status}: ${resp.statusText ?? 'Not Ok'}`)
    }
  })

export default fetchData

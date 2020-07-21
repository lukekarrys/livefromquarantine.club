import {
  Track,
  Videos,
  Tracks,
  VideoId,
  TrackId,
  ArtistMeta,
  ArtistId,
} from '../types'

interface NormalizedData {
  videos: Videos
  tracks: Tracks
  meta: ArtistMeta
}

interface ApiSong {
  name: string
  start: number
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
  const start = song.start
  const end = video.songs[index + 1]?.start ?? video.duration
  return {
    id: `${video.id}-${start}` as TrackId,
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

const fetchData = (id: ArtistId): Promise<NormalizedData> =>
  fetch(`/.netlify/functions/videos?id=${id}`).then(async (resp) => {
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

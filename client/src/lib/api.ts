import { Track, Data, VideoId, TrackId } from "../types"

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

const normalizeData = (videos: ApiVideo[]): Data => {
  const resp: Data = { videos: [], tracks: [] }

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

const fetchData = (id: string): Promise<Data> =>
  fetch(`/api/${id}.json`).then(async (resp) => {
    if (resp.ok) {
      const videos = await resp.json()
      return normalizeData(videos)
    } else {
      throw new Error(`${resp.status}: not ok`)
    }
  })

export default fetchData

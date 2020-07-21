import { Track } from '../types'

export const toSongAndVideoTitle = (track?: Track): string | undefined => {
  return Array.isArray(track?.title)
    ? track?.title.slice(0).reverse().join(' - ')
    : track?.title
}

export const toSongTitle = (track?: Track): string | undefined => {
  return Array.isArray(track?.title) ? track?.title[1] : undefined
}

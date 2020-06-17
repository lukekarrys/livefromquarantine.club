import { Track } from '../types'

const toTitle = (track?: Track): string | undefined => {
  return Array.isArray(track?.title)
    ? track?.title.slice(0).reverse().join(' - ')
    : track?.title
}

export const toSongTitle = (
  track?: Track,
  def = 'Play All'
): string | undefined => {
  return Array.isArray(track?.title) ? track?.title[1] : def
}

export default toTitle

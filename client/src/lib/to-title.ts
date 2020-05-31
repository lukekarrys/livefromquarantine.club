import { Track } from '../types'

const toTitle = (track?: Track): string | undefined => {
  return Array.isArray(track?.title) ? track?.title.join(' - ') : track?.title
}

export default toTitle

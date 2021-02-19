import { Howler } from 'howler'

class MediaPlayer {
  player?: YT.Player | Howler | null

  constructor(player?: YT.Player | Howler) {
    this.player = player
  }

  playVideo(): void {
    if (this.player instanceof YT.Player) {
      this.player.playVideo()
    }
  }

  pauseVideo(): void {
    if (this.player instanceof YT.Player) {
      this.player.pauseVideo()
    }
  }

  cueById(mediaId: string, startSeconds?: number): void {
    if (this.player instanceof YT.Player) {
      this.player.cueVideoById(mediaId, startSeconds)
    }
  }

  loadById(mediaId: string, startSeconds?: number): void {
    if (this.player instanceof YT.Player) {
      this.player.loadVideoById(mediaId, startSeconds)
    }
  }

  seekTo(seconds: number, allowSeekAhead: boolean): void {
    if (this.player instanceof YT.Player) {
      return this.player.seekTo(seconds, allowSeekAhead)
    }
  }

  getCurrentTime(): number {
    if (this.player instanceof YT.Player) {
      return this.player.getCurrentTime()
    }

    return 0
  }
}

export default MediaPlayer

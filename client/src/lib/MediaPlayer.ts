import { VideoId } from '../types'

const assertYT = (player: unknown): player is YT.Player =>
  window.YT && player instanceof YT.Player

const assertAudio = (player: unknown): player is HTMLAudioElement =>
  player instanceof HTMLAudioElement

class MediaPlayer {
  player?: YT.Player | HTMLAudioElement

  constructor(player?: YT.Player | HTMLAudioElement) {
    this.player = player
  }

  private addEventListenerOnce(
    event: keyof HTMLMediaElementEventMap,
    listener: (
      element: HTMLAudioElement,
      ev: HTMLMediaElementEventMap[typeof event]
    ) => void
  ): void {
    if (assertAudio(this.player)) {
      const player = this.player
      const listenerWithRemove = (
        e: HTMLMediaElementEventMap[keyof HTMLMediaElementEventMap]
      ) => {
        player.removeEventListener(event, listenerWithRemove)
        listener(player, e)
      }
      player.addEventListener(event, listenerWithRemove)
    }
  }

  private loadAndSeek(
    mediaId: VideoId,
    startSeconds: number,
    onLoad?: (player: HTMLAudioElement) => void
  ) {
    if (assertAudio(this.player)) {
      this.player.src = new URL(
        `/mp3?id=${mediaId}`,
        process.env.MEDIA_SERVER
      ).toString()

      this.addEventListenerOnce('canplay', (player) => {
        player.currentTime = startSeconds
        if (onLoad) onLoad(player)
      })

      this.player.load()
    }
  }

  play(): void {
    if (assertYT(this.player)) {
      this.player.playVideo()
    }

    if (assertAudio(this.player)) {
      void this.player.play()
    }
  }

  pause(): void {
    if (assertYT(this.player)) {
      this.player.pauseVideo()
    }

    if (assertAudio(this.player)) {
      this.player.pause()
    }
  }

  cueById(mediaId: VideoId, startSeconds = 0): void {
    if (assertYT(this.player)) {
      this.player.cueVideoById(mediaId, startSeconds)
    }

    if (assertAudio(this.player)) {
      this.loadAndSeek(mediaId, startSeconds)
    }
  }

  loadById(mediaId: VideoId, startSeconds = 0): void {
    if (assertYT(this.player)) {
      this.player.loadVideoById(mediaId, startSeconds)
    }

    if (assertAudio(this.player)) {
      this.loadAndSeek(mediaId, startSeconds, (p) => void p.play())
    }
  }

  seekTo(seconds: number, allowSeekAhead = true): void {
    if (assertYT(this.player)) {
      this.player.seekTo(seconds, allowSeekAhead)
    }

    if (assertAudio(this.player)) {
      this.player.currentTime = seconds
    }
  }

  getCurrentTime(): number {
    if (assertYT(this.player)) {
      return this.player.getCurrentTime()
    }

    if (assertAudio(this.player)) {
      return this.player.currentTime
    }

    throw new Error('This should not be reached')
  }
}

export default MediaPlayer

/* global YT */
;(() => {
  const $el = (t, text = '', props = {}) => {
    const el = document.createElement(t)
    el.innerText = text
    if (props.class) {
      el.classList.add(props.class)
      delete props.class
    }
    Object.keys(props).forEach((k) => {
      el[k] = props[k]
    })
    return el
  }

  const $ = (sel) => document.querySelector(sel)
  const $$ = (sel) => document.querySelectorAll(sel)

  const removeNode = (n) => n.parentNode.removeChild(n)

  const getTitle = ({ video, song }) =>
    `${video.title} - ${(song && song.name) || 'All'}`

  const nextItem = (arr, item) =>
    item ? arr[arr.findIndex((i) => i === item) + 1] : undefined

  const shuffleArray = (a) => {
    let j, x, i
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1))
      x = a[i]
      a[i] = a[j]
      a[j] = x
    }
    return a
  }

  const getSongStartEnd = ({ song, video }) => {
    const res = {}
    if (!song) return res
    if (song.time.start) {
      res.start = song.time.start
    }
    const next = nextItem(video.songs, song)
    const end = song.time.end || next ? next.time.start : null
    if (end) {
      res.end = end
    }
    return res
  }

  let player
  let isPlaying = false
  let isShuffled = false
  let isRepeat = null
  let isQueueMode = true // TODO: figure out good UX to toggle this for skipping between songs
  let nowPlaying = null
  let progressInterval = null
  let upNext = []
  let shuffleUpNext = []
  const DATA = window.__DATA
  const FLAT_DATA = DATA.flatMap((video) =>
    (video.songs || []).map((song) => ({ video, song }))
  )
  const $shuffleButton = $('#shuffle')
  const $repeatButton = $('#repeat')
  const $repeatText = $('#repeat-type')
  const $progress = $('#progress')
  const $songs = $('#songs')
  const $upnext = $('#upnext')
  const $upnextText = $$('.upnext-text')
  const $playPause = $('#play-pause')
  const activeClass = 'active'
  const playButtonClass = 'play-button'
  const buttonPrefix = 'b-'

  const guardPlayer = (cb) => (...args) => {
    if (!player) return
    return cb(...args)
  }

  const playId = ({ video, song }) =>
    `${buttonPrefix}${video.id}${
      song ? `-${video.songs.findIndex((s) => s === song)}` : ''
    }`

  const setUpNextText = () =>
    $upnextText.forEach(
      (n) =>
        (n.textContent = `Up next${upNext.length ? ` (${upNext.length})` : ''}`)
    )

  const resetQueue = () => {
    upNext = []
    $upnext.innerHTML = ''
    setUpNextText()
  }

  const setShuffle = () => {
    isShuffled = !isShuffled
    $shuffleButton.classList[isShuffled ? 'add' : 'remove'](activeClass)
    shuffleUpNext = isShuffled ? shuffleArray(FLAT_DATA) : []
    if (isShuffled && !isPlaying) playNextInQueue()
  }

  const setRepeat = () => {
    const repeatTypes = [null, 'REPEAT_SONG', 'REPEAT_VIDEO']
    const repeatLabels = ['', 'song', 'video']
    const current = repeatTypes.findIndex((v) => v === isRepeat)
    const nextIndex = current + 1 >= repeatTypes.length ? 0 : current + 1
    isRepeat = repeatTypes[nextIndex]
    $repeatText.innerText = repeatLabels[nextIndex]
    $repeatButton.classList.toggle('active', nextIndex > 0)
  }

  const moveToFrontOfQueue = (item) => {
    removeFromQueue(item)
    addToQueue({ video: item.video, song: item.song }, false)
  }

  const removeFromQueue = (item) => {
    const index = upNext.findIndex((i) => i === item)
    upNext.splice(index, 1)
    removeNode($(`#${item.id}`))
    setUpNextText()
  }

  const removeFromShuffleQueue = (item) => {
    const index = shuffleUpNext.findIndex((i) => i === item)
    shuffleUpNext.splice(index, 1)
    // If removing the last song from the shuffle queue but still in shuffle mode
    // set it up again. FROM THE TOP!
    if (isShuffled && !shuffleUpNext.length) {
      shuffleUpNext = shuffleArray(FLAT_DATA)
    }
  }

  const playNextInQueue = () => {
    const next = upNext[0]
    const shuffleNext = shuffleUpNext[0]
    if (isRepeat && nowPlaying) {
      const { video, song } = nowPlaying
      if (isRepeat === 'REPEAT_SONG') {
        playSong({ video, song })
      } else if (isRepeat === 'REPEAT_VIDEO') {
        const next = nextItem(video.songs, song)
        if (next) {
          playSong({ video, song: next })
        } else {
          playSong({ video, song: song && video.songs[0] })
        }
      }
    } else if (next) {
      removeFromQueue(next)
      playSong(next)
    } else if (shuffleNext) {
      removeFromShuffleQueue(shuffleNext)
      playSong(shuffleNext)
    } else if (nowPlaying) {
      const { video, song } = nowPlaying
      const next = nextItem(video.songs, song)
      const nextVideo = nextItem(DATA, video)
      if (next) {
        playSong({ video, song: next })
      } else if (nextVideo) {
        // If we are currently playing a whole video instead of an individual
        // song, then go to the next whole video
        playSong({ video: nextVideo, song: song && nextVideo.songs[0] })
      } else {
        // wrap around back to the beginning, NEVER STOP NEVER STOPPING
        playSong({ video: DATA[0], song: song && DATA[0].songs[0] })
      }
    } else {
      playSong(FLAT_DATA[0])
    }
  }

  const addToQueue = ({ video, song }, back = true) => {
    const id = `n-${Math.random().toString().slice(2)}`
    const item = { video, song, id }
    const button = $el('button', getTitle({ video, song }), {
      id,
      onclick: () => moveToFrontOfQueue(item),
    })
    if (back) {
      upNext.push(item)
      $upnext.appendChild(button)
    } else {
      upNext.unshift(item)
      $upnext.prepend(button)
    }
    setUpNextText()
  }

  const playSong = guardPlayer(({ video, song }) => {
    if (!nowPlaying) {
      $('#player').style.display = 'block'
      $('#player-mock').style.display = 'none'
    }

    const v = {
      videoId: video.id,
    }

    if (song) {
      const { start, end } = getSongStartEnd({ video, song })
      v.startSeconds = start
      if (end) v.endSeconds = end
    }

    nowPlaying = { video, song }
    $('#nowplaying-text').innerText = getTitle({ video, song })
    $$(`.${playButtonClass}`).forEach((n) => n.classList.remove(activeClass))

    const buttonId = `#${playId({ video, song })}`
    const $button = $(buttonId)
    $button.classList.add(activeClass)

    const buttonTop = $button.offsetTop - $songs.offsetTop - $songs.scrollTop
    const buttonBottom = $button.getBoundingClientRect().height + buttonTop
    const songsHeight = $songs.getBoundingClientRect().height
    if (buttonTop < 0 || buttonBottom > songsHeight) {
      $button.parentNode.parentNode.scrollIntoView()
    }

    // debug queue
    // v.endSeconds = v.startSeconds + 10

    console.log('loadVideoById', v)
    $progress.style.width = '0'
    player.loadVideoById(v)
    play()
  })

  const setProgressInterval = guardPlayer(() => {
    const song = getSongStartEnd(nowPlaying)
    const start = song.start || 0

    clearInterval(progressInterval)
    progressInterval = setInterval(() => {
      const end = song.end || player.getDuration()
      const current = player.getCurrentTime()
      if (!current) return
      $progress.style.width = `${((current - start) / (end - start)) * 100}%`
    }, 1000 / 60)
  })

  const play = guardPlayer(() => {
    isPlaying = true
    $playPause.classList.add('playing', 'active')
    setProgressInterval()
    player.playVideo()
  })

  const pause = guardPlayer(() => {
    isPlaying = false
    $playPause.classList.remove('playing', 'active')
    clearInterval(progressInterval)
    player.pauseVideo()
  })

  const togglePlayPause = () => {
    if (isPlaying) {
      pause()
    } else if (!nowPlaying) {
      playNextInQueue()
    } else {
      play()
    }
  }

  const playOrAddToQueue = ({ video, song }) => {
    console.log('play or up next', {
      isPlaying,
      length: upNext.length,
      isQueueMode,
    })
    if ((!isPlaying && upNext.length === 0) || !isQueueMode) {
      playSong({ video, song })
    } else {
      addToQueue({ video, song })
    }
  }

  DATA.forEach((video) => {
    const $videoHolder = $el('div', '', { class: 'video' })
    $videoHolder.appendChild($el('h2', video.title))

    if (!video.songs) {
      $videoHolder.appendChild($el('p', 'No timestamps for this video'))
    }

    const $buttonHolder = $el('div', '', { class: 'buttons' })

    $buttonHolder.appendChild(
      $el('button', '+PLAY ALL+', {
        id: playId({ video }),
        class: playButtonClass,
        onclick: () => playOrAddToQueue({ video }, false),
      })
    )
    ;(video.songs || []).forEach((song) => {
      $buttonHolder.appendChild(
        $el('button', song.name, {
          id: playId({ video, song }),
          class: playButtonClass,
          onclick: () =>
            playOrAddToQueue(
              {
                video,
                song,
              },
              false
            ),
        })
      )
    })

    $videoHolder.appendChild($buttonHolder)
    $songs.appendChild($videoHolder)
  })

  // eslint-disable-next-line no-unused-vars
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    })
  }
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady

  function onPlayerReady(event) {
    console.log('ready', event)
    const hash = window.location.hash.slice(1)
    if (hash) {
      const [playSong, ...queueSongs] = hash.split(',')
      $(`#${buttonPrefix}${playSong}`).click()
      queueSongs
        .map((songId) => {
          const [videoId, songIndex] = songId.split('-')
          const video = DATA.find((v) => v.id === videoId)
          const song = (video.songs || [])[songIndex]
          return video ? { video, song } : null
        })
        .filter(Boolean)
        .forEach((v) => addToQueue(v))
    }
  }

  const getShareUrl = () => {
    return (
      window.location.origin +
      window.location.pathname +
      '#' +
      [nowPlaying, ...upNext]
        .filter(Boolean)
        .map((v) => playId(v).replace(buttonPrefix, ''))
        .join(',')
    )
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && isPlaying) {
      playNextInQueue()
    } else if (event.data === YT.PlayerState.PAUSED) {
      pause()
    } else if (event.data === YT.PlayerState.PLAYING) {
      play()
    }
  }

  $shuffleButton.addEventListener('click', setShuffle)
  $repeatButton.addEventListener('click', setRepeat)
  $('#next').addEventListener('click', playNextInQueue)
  $playPause.addEventListener('click', togglePlayPause)
  $$('.reset-button').forEach((n) => n.addEventListener('click', resetQueue))
  $('#upnext-toggle').addEventListener('click', () => {
    document.body.classList.toggle('drawer-open')
  })
  $('#share').addEventListener('click', () => {
    const wasPlaying = isPlaying
    wasPlaying && pause()
    setTimeout(() => {
      window.prompt('This url has your current queue', getShareUrl())
      wasPlaying && play()
    }, 1)
  })
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    else if (e.key === 'ArrowRight') playNextInQueue()
    else if (e.key === ' ') togglePlayPause()
    else if (e.key === 's') setShuffle()
    else if (e.key === 'x') resetQueue()
    else if (e.key === 'r') setRepeat()
  })
})()

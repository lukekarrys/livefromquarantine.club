/* global YT */

const parseSeconds = (str) => {
  let seconds = 0
  const [min, sec] = str.split(':').map((v) => parseInt(v, 10))
  if (min) seconds += min * 60
  seconds += sec
  return seconds
}

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

const playId = ({ video, song }) =>
  `b-${video.id}${song ? `-${parseSeconds(song.time.start)}` : ''}`

const nextItem = (arr, item) => arr[arr.findIndex((i) => i === item) + 1]

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

let player
let playing = false
let initial = true
let nowPlaying = null
let upNext = []
const DATA = window.__DATA
const $songs = $('#songs')
const $upnext = $('#upnext')

const resetQueue = () => {
  upNext = []
  $upnext.innerHTML = ''
  $$('.upnext-text').forEach((n) => (n.textContent = `Up next`))
}

const addShuffleToQueue = () => {
  const shuffledSongs = shuffleArray(
    DATA.reduce((acc, video) => {
      ;(video.songs || []).forEach((song) => {
        acc.push({ video, song })
      })
      return acc
    }, [])
  )
  shuffledSongs.forEach((item, index) => {
    if (index === 0) {
      playOrAddToQueue(item)
    } else {
      addToQueue(item)
    }
  })
}

const moveToFrontOfQueue = (item) => {
  removeFromQueue(item)
  addToQueue({ video: item.video, song: item.song }, false)
}

const removeFromQueue = (item) => {
  const index = upNext.findIndex((i) => i === item)
  upNext.splice(index, 1)
  removeNode($(`#${item.id}`))
  $$('.upnext-text').forEach(
    (n) => (n.textContent = `Up next (${upNext.length})`)
  )
}

const playNextInQueue = () => {
  const next = upNext[0]
  if (next) {
    removeFromQueue(next)
    play(next)
  } else if (nowPlaying) {
    const { video, song } = nowPlaying
    const next = nextItem(video.songs, song)
    if (next) {
      play({ video, song: next })
    } else {
      const nextVideo = nextItem(DATA, video)
      if (nextVideo) {
        play({ video: nextVideo, song: nextVideo.songs[0] })
      } else {
        play({ video: DATA[0], song: DATA[0].songs[0] })
      }
    }
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
  $$('.upnext-text').forEach(
    (n) => (n.textContent = `Up next (${upNext.length})`)
  )
  // console.log(item, upNext.length)
}

const play = ({ video, song }) => {
  if (initial) {
    $('#player').style.display = 'block'
    $('#player-mock').style.display = 'none'
  }

  const v = {
    videoId: video.id,
  }

  if (song) {
    if (song.time.start) {
      v.startSeconds = parseSeconds(song.time.start)
    }
    const next = nextItem(video.songs, song)
    const end = song.time.end || next ? next.time.start : null
    if (end) {
      v.endSeconds = parseSeconds(end)
    }
  }

  nowPlaying = { video, song }
  $('#nowplaying').innerText = getTitle({ video, song })
  $$('.play-button').forEach((n) => n.classList.remove('is-playing'))

  const buttonId = `#${playId({ video, song })}`
  $(buttonId).classList.add('is-playing')
  $(buttonId).parentNode.parentNode.scrollIntoView()

  // debug queue
  // v.endSeconds = v.startSeconds + 10

  console.log('loadVideoById', v)
  player.loadVideoById(v)
}

const playOrAddToQueue = ({ video, song }) => {
  console.log('play or up next', playing, upNext.length)
  if (!playing && upNext.length === 0) {
    play({ video, song })
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
      class: 'play-button',
      onclick: () => playOrAddToQueue({ video }),
    })
  )
  ;(video.songs || []).forEach((song) => {
    $buttonHolder.appendChild(
      $el('button', song.name, {
        id: playId({ video, song }),
        class: 'play-button',
        onclick: () =>
          playOrAddToQueue({
            video,
            song,
          }),
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

function onPlayerReady(event) {
  console.log('ready', event)
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    console.log('playing', event)
    playing = true
  } else if (event.data === YT.PlayerState.ENDED && playing) {
    console.log('ended', event)
    playing = false
    playNextInQueue()
  } else if (event.data === YT.PlayerState.PAUSED) {
    console.log('paused', event)
    playing = false
  }
}

$('#shuffle').addEventListener('click', addShuffleToQueue)
$('#next').addEventListener('click', playNextInQueue)
$('#reset').addEventListener('click', resetQueue)
$('#upnext-toggle').addEventListener('click', () => {
  document.body.classList.toggle('drawer-open')
})

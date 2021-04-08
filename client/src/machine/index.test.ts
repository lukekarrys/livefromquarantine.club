import { interpret } from '@xstate/fsm'
import playerMachine from './index'
import { getParsedArtist } from '../../../server/api/artists'
import { normalizeData, NormalizedData, ApiData } from '../lib/api'
import { PlayerService } from './types'

jest.mock('../lib/MediaPlayer')

const getData = async (id: string) => {
  const res = await getParsedArtist(id)
  return normalizeData(res as ApiData)
}

let service: PlayerService | null = null
let data: NormalizedData | null = null

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg)
}

describe('Player machine', () => {
  beforeAll(async () => {
    data = await getData('seanbonnette')
  })

  beforeEach(() => {
    service = interpret(playerMachine)
    service.start()
  })

  afterEach(() => {
    assert(service !== null)
    service.stop()
    service = null
  })

  test('ready with player first', () => {
    assert(service !== null && data !== null)

    expect(service.state.value).toBe('idle')

    service.send({ type: 'PLAYER_READY', player: new Audio() })

    expect(service.state.value).toBe('idle')

    service.send('FETCH_START')

    expect(service.state.value).toBe('loading')

    service.send({ type: 'FETCH_SUCCESS', tracks: data.tracks })

    expect(service.state.value).toBe('ready')
  })

  test('ready with fetch first', () => {
    assert(service !== null && data !== null)

    expect(service.state.value).toBe('idle')

    service.send('FETCH_START')

    expect(service.state.value).toBe('loading')

    service.send({ type: 'FETCH_SUCCESS', tracks: data.tracks })

    expect(service.state.value).toBe('loading')

    service.send({ type: 'PLAYER_READY', player: new Audio() })

    expect(service.state.value).toBe('ready')
  })

  test('do a bunch of stuff to see what coverage is like', () => {
    assert(service !== null && data !== null)

    expect(service.state.value).toBe('idle')

    service.send({ type: 'PLAYER_READY', player: new Audio() })
    service.send('FETCH_START')
    service.send({ type: 'FETCH_SUCCESS', tracks: data.tracks })

    expect(service.state.value).toBe('ready')
    expect(service.state.context.tracks.length).toBeGreaterThanOrEqual(1544)

    service.send('SHUFFLE')
    service.send('PLAY')
    service.send('PAUSE')
    service.send('PLAY')
    service.send('NEXT_TRACK')
    service.send('NEXT_TRACK')
    service.send('PAUSE')
    service.send('NEXT_TRACK')
    service.send('PLAY')

    service.send('SHUFFLE')
    service.send('SHUFFLE')

    service.send('REPEAT')
    service.send('REPEAT')

    service.send({
      type: 'SELECT_TRACK',
      order: 'order',
      orderId: service.state.context.tracks[0].id,
      trackId: service.state.context.tracks[0].id,
    })

    service.send({
      type: 'SELECT_TRACK',
      order: 'order',
      orderId: service.state.context.tracks[20].id,
      trackId: service.state.context.tracks[20].id,
    })

    service.send('SELECT_MODE')

    service.send({
      type: 'SELECT_TRACK',
      order: 'order',
      orderId: service.state.context.tracks[20].id,
      trackId: service.state.context.tracks[20].id,
    })

    service.send({
      type: 'SELECT_TRACK',
      order: 'order',
      orderId: service.state.context.tracks[20].id,
      trackId: service.state.context.tracks[20].id,
    })

    service.send({
      type: 'REMOVE_TRACK',
      order: 'upNext',
      id: service.state.context.upNext.trackOrder[0].orderId,
    })

    service.send({
      type: 'REMOVE_TRACK',
      order: 'upNext',
      id: service.state.context.upNext.trackOrder[0].orderId,
    })
  })
})

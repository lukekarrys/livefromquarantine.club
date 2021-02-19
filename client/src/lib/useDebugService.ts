import { useEffect, useRef } from 'preact/hooks'
import {
  PlayerService,
  PlayerContext,
  PlayerMachineState,
} from '../machine/types'
import * as debug from './debug'

// Log all events through the service
export const useService = (
  service: PlayerService,
  shape?: (state: PlayerMachineState) => unknown
): void => {
  useEffect(() => {
    const subscription = service.subscribe((s) =>
      debug.log('PLAYER MACHINE', shape ? shape(s) : s)
    )
    return (): void => subscription.unsubscribe()
  }, [service, shape])
}

// Only logs when the context has changed
export const useContext = (
  service: PlayerService,
  shape?: (c: PlayerContext) => unknown
): void => {
  const lastContext = useRef('')
  useEffect(() => {
    const subscription = service.subscribe((s) => {
      const context = shape ? shape(s.context) : s.context
      const contextKey = JSON.stringify(context)
      if (contextKey !== lastContext.current) {
        debug.log(context)
      }
      lastContext.current = contextKey
    })
    return (): void => subscription.unsubscribe()
  }, [service, shape])
}

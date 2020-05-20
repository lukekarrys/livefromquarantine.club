import { useEffect } from 'preact/hooks'
import { PlayerService, PlayerMachineState } from '../machine/types'
import debug from './debug'

const useDebugService = (
  service: PlayerService,
  shape?: (state: PlayerMachineState) => unknown
): void => {
  useEffect(() => {
    const subscription = service.subscribe((s) =>
      debug('PLAYER MACHINE', shape ? shape(s) : s)
    )
    return (): void => subscription.unsubscribe()
  }, [service, shape])
}

export default useDebugService

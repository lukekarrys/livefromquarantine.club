import { useEffect } from 'preact/hooks'
import { PlayerService } from '../machine/types'
import debug from './debug'

const useDebugService = (service: PlayerService): void => {
  useEffect(() => {
    const subscription = service.subscribe((s) =>
      debug('PLAYER MACHINE', {
        value: s.value,
        actions: s.actions.length ? s.actions.map((a) => a.type) : undefined,
        context: s.context,
      })
    )
    return (): void => subscription.unsubscribe()
  }, [service])
}

export default useDebugService

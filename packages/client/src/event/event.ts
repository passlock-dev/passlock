/**
 * Fire DOM events
 */
import { InternalBrowserError } from '@passlock/shared/dist/error/error.js'
import { Effect } from 'effect'

export const DebugMessage = 'PasslogDebugMessage'

export const fireEvent = (message: string) => {
  return Effect.try({
    try: () => {
      const evt = new CustomEvent(DebugMessage, { detail: message })
      globalThis.dispatchEvent(evt)
    },
    catch: () => {
      return new InternalBrowserError({ message: 'Unable to fire custom event' })
    },
  })
}

export function isPasslockEvent(event: Event): event is CustomEvent {
  if (event.type !== DebugMessage) return false
  return 'detail' in event
}

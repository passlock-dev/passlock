/**
 * Logger implementation that also fires DOM events.
 * This is useful to allow external code to plug into the logging
 * mechanism. E.g. the Passlock demo subscribes to events to generate
 * a typewriter style effect
 */
import { Effect as E, LogLevel, Logger } from 'effect'

/**
 * Some log messages span multiple lines/include json etc which is
 * better output without being formatted by Effect's logging framework
 *
 * @param message
 * @returns
 */
export const logRaw = <T>(message: T) => {
  return E.sync(() => {
    console.log(message)
  })
}

export const DebugMessage = 'PasslogDebugMessage'

const dispatch = (message: string) => {
  try {
    const evt = new CustomEvent(DebugMessage, { detail: message })
    globalThis.dispatchEvent(evt)
  } catch {
    globalThis.console.log('Unable to fire custom event')
  }
}

export const eventLoggerLive = Logger.add(
  Logger.make(({ logLevel, message }) => {
    if (typeof message === 'string' && logLevel !== LogLevel.Debug) {
      dispatch(message)
    } else if (Array.isArray(message) && logLevel !== LogLevel.Debug) {
      message.forEach(dispatch)
    }
  }),
)

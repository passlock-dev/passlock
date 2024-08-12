import { Effect as E, LogLevel, Logger } from 'effect'
import { describe, expect, test, vi } from 'vitest'
import { eventLoggerLive, logRaw } from './eventLogger.js'

/**
 * Although the core log functionality is tested alongside the logger in the @passlock/shared
 * package, those tests deliberately exclude the event dispatch elements as the package
 * is intended to be agnostic to the runtime environment. This client package however is
 * intented to be run in the browser, so we can plugin a real event dispatcher and ensure
 * it's working as expected.
 */

describe('log', () => {
  test('log DEBUG to the console', () => {
    const logStatement = E.logDebug('hello world')

    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined)
    const withLogLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Debug))

    const effect = E.provide(withLogLevel, eventLoggerLive)
    E.runSync(effect)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'))
  })

  test('log INFO to the console', () => {
    const logStatement = E.logInfo('hello world')

    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined)
    const withLogLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Info))

    const effect = E.provide(withLogLevel, eventLoggerLive)
    E.runSync(effect)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'))
  })

  test('log WARN to the console', () => {
    const logStatement = E.logWarning('hello world')

    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined)
    const withLogLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Warning))

    const effect = E.provide(withLogLevel, eventLoggerLive)
    E.runSync(effect)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))
  })

  test('log ERROR to the console', () => {
    const logStatement = E.logError('hello world')

    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined)
    const withLogLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Error))

    const effect = E.provide(withLogLevel, eventLoggerLive)
    E.runSync(effect)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'))
  })

  test('log raw data to the console', () => {
    const logStatement = logRaw('hello world')
    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined)

    E.runSync(logStatement)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('hello world'))
  })

  test('fire a custom log event', () => {
    const logStatement = E.logWarning('hello world')

    const eventSpy = vi.spyOn(globalThis, 'dispatchEvent').mockImplementation(() => false)
    const withLogLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Warning))

    const effect = E.provide(withLogLevel, eventLoggerLive)

    E.runSync(effect)

    const expectedEvent = new CustomEvent('PasslogDebugMessage', {
      detail: 'hello world',
    })

    expect(eventSpy).toHaveBeenCalledWith(expectedEvent)
  })

  test('not fire a log event for a debug message', () => {
    const logStatement = E.logDebug('hello world')

    const eventSpy = vi.spyOn(globalThis, 'dispatchEvent').mockImplementation(() => false)
    const withDebugLevel = logStatement.pipe(Logger.withMinimumLogLevel(LogLevel.Debug))

    const effect = E.provide(withDebugLevel, eventLoggerLive)
    E.runSync(effect)

    expect(eventSpy).not.toHaveBeenCalled()
  })
})

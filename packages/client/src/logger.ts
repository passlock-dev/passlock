import { Context, Micro } from "effect"

/**
 * Allows us to plug in specific implementations.
 * @see consoleLogger and eventLogger
 */
export class Logger extends Context.Tag("ClientLogger")<
  Logger,
  {
    readonly logDebug: (message: string) => Micro.Micro<void>
    readonly logInfo: (message: string) => Micro.Micro<void>
    readonly logWarn: (message: string) => Micro.Micro<void>
    readonly logError: (message: string) => Micro.Micro<void>
  }
>() {}

/**
 * Logs to the JS console
 */
export const consoleLogger: typeof Logger.Service = {
  logDebug: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.log(message, optionalArgs)
    }),

  logError: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.log(message, optionalArgs)
    }),

  logInfo: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.log(message, optionalArgs)
    }),

  logWarn: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.log(message, optionalArgs)
    }),
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
  WARN = "WARN",
}

/**
 * Custom event representing a log message
 */
export class LogEvent extends Event {
  readonly #message: string
  readonly #level: LogLevel

  static name = "PasslockLogEvent"

  constructor(message: string, level: LogLevel) {
    super(LogEvent.name)
    this.#message = message
    this.#level = level
  }

  get message(): string {
    return this.#message
  }

  get level(): LogLevel {
    return this.#level
  }
}

const logEvent = (level: LogLevel) => (message: string) =>
  Micro.sync(() => {
    if (typeof message === "string") {
      window.dispatchEvent(new LogEvent(message, level))
    }
  })

/**
 * Fires JS events instead of writing to the console.
 * Hook into it by listening for PasslockLogEvent events
 * @see LogEvent
 */
export const eventLogger: typeof Logger.Service = {
  logDebug: logEvent(LogLevel.DEBUG),
  logError: logEvent(LogLevel.ERROR),
  logInfo: logEvent(LogLevel.INFO),
  logWarn: logEvent(LogLevel.WARN),
}

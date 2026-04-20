import { Context, Micro } from "effect"

/**
 * Effect service used by the browser modules for structured logging.
 *
 * @see consoleLogger and eventLogger
 */
export class Logger extends Context.Tag("BrowserLogger")<
  Logger,
  {
    readonly logDebug: (message: string) => Micro.Micro<void>
    readonly logInfo: (message: string) => Micro.Micro<void>
    readonly logWarn: (message: string) => Micro.Micro<void>
    readonly logError: (message: string) => Micro.Micro<void>
  }
>() {}

/**
 * Logger implementation that writes messages to the browser console.
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

/**
 * Available log levels emitted by {@link LogEvent}.
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
  WARN = "WARN",
}

/**
 * DOM event emitted for a single log entry.
 *
 * Listen for `PasslockLogEvent` on `window` when using the event-based logger.
 */
export class LogEvent extends Event {
  readonly #message: string
  readonly #level: LogLevel

  /**
   * DOM event name used for Passlock log events.
   */
  static name = "PasslockLogEvent"

  /**
   * @param message Human-readable log message.
   * @param level Severity level for the log entry.
   */
  constructor(message: string, level: LogLevel) {
    super(LogEvent.name)
    this.#message = message
    this.#level = level
  }

  /**
   * Log message carried by the event.
   */
  get message(): string {
    return this.#message
  }

  /**
   * Severity level carried by the event.
   */
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
 * Logger implementation that emits {@link LogEvent} DOM events instead of
 * writing to the console. Hook into it by listening for
 * `PasslockLogEvent` events.
 *
 * @see LogEvent
 */
export const eventLogger: typeof Logger.Service = {
  logDebug: logEvent(LogLevel.DEBUG),
  logError: logEvent(LogLevel.ERROR),
  logInfo: logEvent(LogLevel.INFO),
  logWarn: logEvent(LogLevel.WARN),
}

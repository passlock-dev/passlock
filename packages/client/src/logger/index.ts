import { Context, Micro } from "effect";

export class Logger extends Context.Tag("Logger")<
  Logger,
  {
    readonly logDebug: (message: string) => Micro.Micro<void>;
    readonly logInfo: (message: string) => Micro.Micro<void>;
    readonly logError: (message: string) => Micro.Micro<void>;
  }
>() {}

export const ConsoleLogger: typeof Logger.Service = {
  logDebug: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.debug(message, optionalArgs);
    }),

  logInfo: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.info(message, optionalArgs);
    }),

  logError: (message: string | object, ...optionalArgs: Array<unknown>) =>
    Micro.sync(() => {
      console.error(message, optionalArgs);
    }),
};

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
}

export class LogEvent extends Event {
  readonly #message: string;
  readonly #level: LogLevel;

  static name = "PasslockLogEvent";

  constructor(message: string, level: LogLevel) {
    super(LogEvent.name);
    this.#message = message;
    this.#level = level;
  }

  get message(): string {
    return this.#message;
  }

  get level(): LogLevel {
    return this.#level;
  }
}

const logEvent = (level: LogLevel) => (message: string) =>
  Micro.sync(() => {
    if (typeof message === "string") {
      window.dispatchEvent(new LogEvent(message, level));
    }
  });

export const EventLogger: typeof Logger.Service = {
  logDebug: logEvent(LogLevel.DEBUG),
  logInfo: logEvent(LogLevel.INFO),
  logError: logEvent(LogLevel.ERROR),
};

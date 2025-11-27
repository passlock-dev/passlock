import { Context, Micro } from "effect";

export class Logger extends Context.Tag("Logger")<
  Logger,
  {
    readonly logDebug: (message: string) => Micro.Micro<void>;
    readonly logInfo: (message: string) => Micro.Micro<void>;
    readonly logError: (message: string) => Micro.Micro<void>;
  }
>() {}

export const LoggerLive: typeof Logger.Service = {
  logDebug: (message: string) =>
    Micro.sync(() => {
      console.log("debug");
      console.debug(message);
    }),

  logInfo: (message: string) =>
    Micro.sync(() => {
      console.log("info");
      console.info(message);
    }),

  logError: (message: string) =>
    Micro.sync(() => {
      console.log("error");
      console.error(message);
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

export const EventLogger: typeof Logger.Service = {
  logDebug: (message: string) =>
    Micro.sync(() => {
      window.dispatchEvent(new LogEvent(message, LogLevel.DEBUG));
    }),

  logInfo: (message: string) =>
    Micro.sync(() => {
      window.dispatchEvent(new LogEvent(message, LogLevel.INFO));
    }),

  logError: (message: string) =>
    Micro.sync(() => {
      window.dispatchEvent(new LogEvent(message, LogLevel.ERROR));
    }),
};

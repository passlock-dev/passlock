#!/usr/bin/env node

/*
 * Originally built using @effect/cli but kept hitting
 * peer resolution issues. This might get easier with
 * Effect v4 so we might go back to cli later.
 */
import { Console, Data, Effect, pipe } from "effect"
import { init } from "./init.js"
import { type NetworkFetch, NetworkFetchLive } from "./network.js"

const VERSION = "#{VERSION}#"
const DEFAULT_ENDPOINT = "https://api.passlock.dev"

const MAIN_HELP_TEXT = [
  "Passlock CLI tools",
  "",
  "Usage:",
  "  passlock [command] [options]",
  "",
  "Commands:",
  "  init              Setup a new Passlock cloud instance",
  "",
  "Options:",
  "  -h, --help        Show this help message",
  "  -v, --version     Show the current version",
  "",
  "Run 'passlock init --help' for command-specific options.",
].join("\n")

const INIT_HELP_TEXT = [
  "Setup a new Passlock cloud instance",
  "",
  "Usage:",
  "  passlock init [options]",
  "",
  "Options:",
  "  -e, --endpoint <url>  Passlock API endpoint",
  `                       (default: ${DEFAULT_ENDPOINT})`,
  "  -h, --help            Show this help message",
].join("\n")

export type ParsedCommand =
  | { readonly _tag: "show-main" }
  | { readonly _tag: "show-main-help" }
  | { readonly _tag: "show-init-help" }
  | { readonly _tag: "show-version" }
  | { readonly _tag: "run-init"; readonly endpoint: string }

class CliParseError extends Data.TaggedError("@error/CliParse")<{
  readonly message: string
}> {}

const isHelpFlag = (arg: string): boolean => arg === "--help" || arg === "-h"

const isVersionFlag = (arg: string): boolean =>
  arg === "--version" || arg === "-v"

export const parseInitArgs = (
  args: ReadonlyArray<string>
): Effect.Effect<ParsedCommand, CliParseError> =>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: arg passing is hard
  Effect.gen(function* () {
    let endpoint = DEFAULT_ENDPOINT

    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i]
      if (arg === undefined) {
        continue
      }

      if (isHelpFlag(arg)) {
        return { _tag: "show-init-help" } as const
      }

      if (arg === "--endpoint" || arg === "-e") {
        const value = args[i + 1]

        if (value === undefined || value.startsWith("-")) {
          return yield* new CliParseError({
            message: "Missing value for --endpoint. Use --endpoint <url>.",
          })
        }

        endpoint = value
        i += 1
        continue
      }

      if (arg.startsWith("--endpoint=")) {
        const value = arg.slice("--endpoint=".length)
        if (value.length === 0) {
          return yield* new CliParseError({
            message: "Missing value for --endpoint. Use --endpoint <url>.",
          })
        }

        endpoint = value
        continue
      }

      if (arg.startsWith("-")) {
        return yield* new CliParseError({
          message: `Unknown option for init: ${arg}`,
        })
      }

      return yield* new CliParseError({
        message: `Unexpected argument for init: ${arg}`,
      })
    }

    return { _tag: "run-init", endpoint } as const
  })

export const parseArgs = (
  argv: ReadonlyArray<string>
): Effect.Effect<ParsedCommand, CliParseError> =>
  Effect.gen(function* () {
    const [first, ...rest] = argv

    if (first === undefined) {
      return { _tag: "show-main" } as const
    }

    if (isHelpFlag(first)) {
      return { _tag: "show-main-help" } as const
    }

    if (isVersionFlag(first)) {
      return { _tag: "show-version" } as const
    }

    if (first === "init") {
      return yield* parseInitArgs(rest)
    }

    return yield* new CliParseError({
      message: `Unknown command: ${first}`,
    })
  })

const runCommand = (
  command: ParsedCommand
): Effect.Effect<void, never, NetworkFetch> =>
  pipe(command, (parsed) => {
    switch (parsed._tag) {
      case "show-main":
        return Console.log(
          "Passlock CLI tools\nRun with --help for commands and options"
        )
      case "show-main-help":
        return Console.log(MAIN_HELP_TEXT)
      case "show-init-help":
        return Console.log(INIT_HELP_TEXT)
      case "show-version":
        return Console.log(VERSION)
      case "run-init":
        return init(parsed.endpoint)
    }
  })

const program = pipe(
  parseArgs(process.argv.slice(2)),
  Effect.flatMap(runCommand),
  Effect.catchTag("@error/CliParse", ({ message }) =>
    pipe(
      Console.error(message),
      Effect.zipRight(Console.log("Run 'passlock --help' for usage.")),
      Effect.zipRight(
        Effect.sync(() => {
          process.exitCode = 1
        })
      )
    )
  )
)

;(async () =>
  pipe(program, Effect.provide(NetworkFetchLive), Effect.runPromise))()

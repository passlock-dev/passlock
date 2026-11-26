#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import * as NodeServices from "@effect/platform-node/NodeServices"
import { Console, Data, Effect, Schema } from "effect"
import { CliConfig, CliError, CliOutput, Command, Flag, GlobalFlag } from "effect/cli"
import { init } from "./init.js"
import { NetworkFetchLive } from "./network.js"

const VERSION = "#{VERSION}#"
const DEFAULT_ENDPOINT = "https://api.passlock.dev"
const DESCRIPTION = "Passlock CLI tools"

// Preserve the parser exports for callers that import the package.
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

const isVersionFlag = (arg: string): boolean => arg === "--version" || arg === "-v"

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

const endpoint = Flag.String("endpoint").pipe(
  Flag.withAlias("e"),
  Flag.withMetavar("url"),
  Flag.withDescription(`Passlock API endpoint (default: ${DEFAULT_ENDPOINT})`),
  Flag.withSchema(Schema.NonEmptyString),
  // The last occurrence wins when users repeat the flag.
  Flag.atLeast(0),
  Flag.map((values) => values.at(-1) ?? DEFAULT_ENDPOINT)
)

const initCommand = Command.make("init", { endpoint }, ({ endpoint }) => init(endpoint)).pipe(
  Command.withDescription("Set up a new Passlock cloud instance")
)

const passlock = Command.make("passlock", {}, () =>
  Console.log(`${DESCRIPTION}\nRun with --help for commands and options`)
).pipe(Command.withDescription(DESCRIPTION), Command.withSubcommands([initCommand]))

const cliConfig = CliConfig.layer({ builtIns: [GlobalFlag.Help, GlobalFlag.Version] })
const cliOutput = CliOutput.layerPresenter({
  present: (event) =>
    event._tag === "Version"
      ? Console.log(event.version)
      : CliOutput.defaultPresenter.present(event),
})

const isMain =
  import.meta.main ??
  (process.argv[1] !== undefined &&
    existsSync(process.argv[1]) &&
    realpathSync(process.argv[1]) === import.meta.filename)

if (isMain) {
  passlock.pipe(
    Command.run({ version: VERSION }),
    Effect.provide([NodeServices.layer, NetworkFetchLive, cliConfig, cliOutput]),
    Effect.catchIf(CliError.isCliError, () =>
      Effect.sync(() => {
        process.exitCode = 1
      })
    ),
    NodeRuntime.runMain
  )
}

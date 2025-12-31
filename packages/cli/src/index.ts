#!/usr/bin/env node

import { Command, Options } from "@effect/cli"
import { HttpClient, HttpClientRequest } from "@effect/platform"
import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Layer, pipe } from "effect"
import { init } from "./init.js"

// prepend the correct endpoint
const mapClient = (endpoint: string) =>
  pipe(
    HttpClient.HttpClient,
    Effect.map(HttpClient.mapRequest(HttpClientRequest.prependUrl(endpoint))),
    Layer.effect(HttpClient.HttpClient)
  )

const endpoint = Options.text("endpoint")
  .pipe(Options.withAlias("e"))
  .pipe(Options.withDescription("Passlock API endpoint"))
  .pipe(Options.withDefault("https://api.passlock.dev"))

const initCmd = pipe(
  Command.make("init", { endpoint }, ({ endpoint }) =>
    pipe(init, Effect.provide(mapClient(endpoint)))
  ),
  Command.withDescription("Setup a new Passlock cloud instance")
)

const mainCmd = pipe(
  Command.make("passlock", {}, () =>
    Console.log("Passlock CLI tools\nRun with --help for commands and options")
  ),
  Command.withDescription("Passlock CLI tools")
)

const command = pipe(mainCmd, Command.withSubcommands([initCmd]))

// Set up the CLI application
const cli = Command.run(command, {
  name: "Passlock CLI tools",
  version: "v2.0.0.alpha.1",
})

// Prepare and run the CLI application
pipe(
  cli(process.argv),
  Effect.provide(NodeHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)

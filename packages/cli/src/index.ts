#!/usr/bin/env node

import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Context, Effect, pipe } from "effect";
import init, { Endpoint } from "./init.js";

const doStuff = Console.log("Doing stuff");

const endpoint = Options.text("endpoint")
  .pipe(Options.withAlias("e"))
  .pipe(Options.withDescription("Passlock API endpoint"))
  .pipe(Options.withDefault("https://api.passlock.dev"));

const initCmd = pipe(
  Command.make("init", { endpoint }, ({ endpoint }) =>
    pipe(init, Effect.provideService(Endpoint, endpoint)),
  ),
  Command.withDescription("Setup a new Passlock cloud instance"),
);

const mainCmd = pipe(
  Command.make("passlock", {}, () => doStuff),
  Command.withDescription("Passlock CLI tools"),
);

const command = pipe(mainCmd, Command.withSubcommands([initCmd]));

// Set up the CLI application
const cli = Command.run(command, {
  name: "Passlock CLI tools",
  version: "v2.0.0.alpha.1",
});

// Prepare and run the CLI application
pipe(cli(process.argv), Effect.provide(NodeContext.layer), NodeRuntime.runMain);

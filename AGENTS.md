## Overview

This is a PNPM monorepo containing the public Passlock code, mostly frontend (browser) and backend (Node.js/Bun/Deno) client libraries. We also include some sample projects, illustrating how to use the client libraries. Most of the client libraries are published as (public) npmjs packages. The monorepo itself is pushed to a public GitHub remote repository.

## Relationship to the private repo

The private monorepo contains the code and infrastructure for the Passlock cloud framework, including the REST APIs, RPC endpoints, the management console and other tooling. Projects in this monorepo are typically client libraries that interact with the REST APIs in the private repo. The private repo is sibling to this repository i.e. `../private`

Packages in the private repo include:

* `packages/core` - Most data access and business logic lives here

* `packages/api` - Our REST API, depends on `packages/core`

* `packages/console` - SvelteKit app, depends on `packages/core`

* `packages/eventbus` - Some async/background tasks are handed off to an AWS eventbus. The code for firing and handling events lives here.

* `packages/website` - Our project website

## Package names

When instructing agents, we often refer to projects by their NPM package names as defined in the relevant package.json file e.g. `@passlock/client`.

## Monorepo structure

The root of this monorepo contains shared config files e.g. biome.json

The repo includes several PNPM projects/packages under the packages/ directory:

* `packages/cli (@passlock/cli)` - A Node.js CLI that allows developers to interact with the Passlock API. Currently it only offers the ability for developers to sign up to use Passlock and obtain their cloud credentials. In the future it will be extended to allow them to perform admin tasks via the Passlock public API.

* `packages/client (@passlock/client)` - The primary TypeScript/JavaScript client (browser) library. This package allows developers to register and authenticate with passkeys on a device. It's intended to be bundled into a deployable app with something like webpack. The `@passlock/client` library invokes APIs exposed via the private `@passlock/api` package.

* `packages/node (@passlock/node)` - Deprecated, see @passlock/server.

* `packages/server (@passlock/server)` - A server-side/backend library used for managing passkeys. Typically used to verify a passkey registration or authentication performed using the `@passlock/client` package. Code in this package also invokes APIs exposed via the private `@passlock/api` package.

It also includes example projects, illustrating how Passlock can be used in the real world. The examples live under the examples/ directory:

* `examples/sveltekit (@passlock/sveltekit-example)` - A full featured SvelteKit project utilitising many of Passlock's features. 

## Programming language and preferred frameworks

Our language of choice is TypeScript.

Wherever possible we use the [Effect](https://effect.website/docs) framework. We prefer a functional style. The exception to this is the sample projects e.g. `examples/sveltekit` which will typically not use Effect.

More details can be found in the AGENTS.md files within the projects.

## TypeScript setup

We use TypeScript project references. Each project includes a base/abstract tsconfig.json file. We also have two concrete config files: tsconfig.build.json and tsconfig.test.json covering the production build and test scenarios. These files extend from the common tsconfig.json file.

## Build and test commands

We largely rely on pnpm scripts for build and test:

* `pnpm run typecheck` - Invoke TSC to typecheck the project. This typechecks **all** code including tests, unlike `build` which excludes tests.

* `pnpm run build` - Invoke TSC to compile the project. Note: this excludes tests (anything under test/ or src/**/*.test.ts).

* `pnpm run clean:all` - Clean build (remove dist/ and tsconfig.tsbuildinfo).

* `pnpm run build:clean` - "clean:all" followed by "build"

* `pnpm run test:unit` - Runs the unit tests

* `pnpm run test:integration` - Runs the integration tests

* `pnpm run test:all` - Runs the unit and integration tests

* `pnpm run format` - Format using Biome.js

* `pnpm run lint:fix` - Lint using Biome.js and attempt to fix any issues

## Important

After making code changes run `pnpm run typecheck` to ensure the code typechecks. This is preferred over `build` as it will typecheck tests. Offer to run `pnpm run test:unit` and `pnpm run test:all` if these targets exist in the project's package.json scripts entry.
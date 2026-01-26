## Overview

This is a PNPM monorepo containing the public Passlock code, mostly frontend (browser) and backend (Node.js) client libraries. Most of the client libraries are pushed to (public) npmjs packages. The monorepo itself is pushed to a public GitHub remote repository.

## Relationship to the private repo

The private repo contains the code and infrastructure for the Passlock framework, including the REST APIs, RPC endpoints, the management console and other tooling. Projects in this monorepo are typically client libraries that interact with the REST APIs in the private repo. 

## Monorepo structure

The root of this monorepo contains shared config files e.g. biome.json

The repo includes several PNPM projects/packages under the packages directory:

* `packages/cli (@passlock/cli)` - A Node.js CLI that allows developers to interact with the Passlock API. Currently it only offers the ability for developers to sign up to use Passlock and obtain their cloud credentials. In the future it will be extended to allow them to perform admin tasks via the Passlock public API.

* `packages/client (@passlock/client)` - The primary TypeScript/JavaScript client (browser) library. This package allows developers to register and authenticate with passkeys on a device. It's intended to be bundled into a deployable app with something like webpack. The `@passlock/client` library invokes APIs exposed via the private `@passlock/api` package.

* `packages/node (@passlock/node)` - A server-side/backend library used for managing passkeys. Typically used to verify a passkey registration or authentication performed using the `@passlock/client` package. Code in this package also invokes APIs exposed via the private `@passlock/api` package.

* `packages/example (@passlock/example)` - A basic Vite project, used largely for shakedown testing of the different packages and components.

## Programming language and preferred frameworks

Our language of choice is TypeScript.

Wherever possible we use the [Effect](https://effect.website/docs) framework. We prefer a functional style.

More details can be found in the AGENTS.md files within the projects.

## Build and test commands

We largely rely on pnpm scripts for build and test:

* `pnpm run build` - Invoke TSC to compile the project

* `pnpm run typecheck` - Invoke TSC to typecheck the project

* `pnpm run clean:all` - Clean build (remove dist/ and tsconfig.tsbuildinfo)

* `pnpm run build:clean` - "clean:all" followed by "build"

* `pnpm run test:unit` - Runs the unit tests

* `pnpm run test:integration` - Runs the integration tests

* `pnpm run test:all` - Runs the unit and integration tests

* `pnpm run format` - Format using Biome.js

* `pnpm run lint:fix` - Lint using Biome.js and attempt to fix any issues

## Important

After making code changes run `pnpm run build` or `pnpm run typecheck` to make sure TSC is happy.

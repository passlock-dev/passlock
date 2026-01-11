## Overview

The `@passlock/node` library is the primary library for interacting with Passlock in backend (Node.js) code. It includes functions for verifying frontend registration and authentication operations performed using the [@passlock/client](../client/) project. It also includes functions to manage passkeys in the Passlock vault.

## Project structure

* `src/passkey` - managing passkeys in the passkey vault

* `src/principal` - verifying passkey registration and authentication operations performed by the `@passlock/client` library. Functions in the client library typically return a `code` and `id_token`, which developers send to their backends. The code in this package allows them to exchange a code or id_token for a Principal or ExtendedPrincipal, representing the frontend operation.

* `src/schemas` - Effect schemas representing the various types that can be returned by the Passlock REST API (private repo)

## Preferred frameworks

Most functions are developed using the [Effect][effect] framework. We make extensive use of [Effect Schema][schema], [Effect Platform][platform] and [Effect HTTP][effect-http]

### "Safe" functions

Developers using the `@passlock/node` library will most likely not be using the Effect framework, so we expose regular Promise-based variants of public functions. e.g. given the function `exchangeCode` in `src/principal/principal.ts` returning an `Effect<A, E>`, we create a function `exchangeCode` in `src/principal/index.ts` returning a `Promise<A | E>`.

We also offer type guards to enable developers to narrow something of type `A | E` down to an `A` or `E`. 

### "Unsafe" functions

For developers who prefer the traditional try/catch style of coding, we offer "unsafe" variants of the functions. These are also exposed in the module's `index.ts` file e.g. `exchangeCodeUnsafe` in `src/principal/index.ts`, returns a `Promise<A>` but potentially throws something of type `E`.

## Build and test commands

We largely rely on pnpm scripts for build and test:

* `pnpm run build` - Invoke TSC to compile the project

* `pnpm run clean:all` - Clean build (remove dist/ and tsconfig.tsbuildinfo)

* `pnpm run build:clean` - "clean:all" followed by "build"

* `pnpm run test --run` - Runs the unit tests

* `pnpm run test:it --run` - Runs the integration tests

* `pnpm run test:all` - Runs the unit and integration tests

* `pnpm run format` - Format using Biome.js

* `pnpm run lint:fix` - Lint using Biome.js and attempt to fix any issues

[effect]: https://effect.website
[platform]: https://effect.website/docs/platform/introduction/
[micro]: https://effect.website/docs/micro/new-users/
[schema]: https://effect.website/docs/schema/introduction/
[effect-http]: https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#overview-1

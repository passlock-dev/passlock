## Overview

The `@passlock/server` library is the primary library for interacting with Passlock in backend code. It includes functions for verifying frontend registration and authentication operations performed using the [@passlock/client](../client/) project. It also includes functions to manage passkeys in the Passlock vault.

## Project structure

* `src/passkey` - managing passkeys in the passkey vault

* `src/principal` - verifying passkey registration and authentication operations performed by the `@passlock/client` library. Functions in the client library typically return a `code` and `id_token`, which developers send to their backends. The code in this package allows them to exchange a code or id_token for a Principal or ExtendedPrincipal, representing the frontend operation.

* `src/schemas` - Effect schemas representing the various types that can be returned by the Passlock REST API (private repo).

* `src/network.ts` - Utility functions for making fetch calls.

## Preferred frameworks

Most functions are developed using the [Effect][effect] framework.

### "Safe" functions

Developers using the `@passlock/server` library will most likely not be using the Effect framework, so we expose regular Promise-based variants of public functions. For tagged success/error APIs, these safe entrypoints return result envelopes over the original payloads. For example, given the function `exchangeCode` in `src/principal/principal.ts` returning an `Effect<A, E>`, we expose an `exchangeCode` in `src/safe.ts` returning a `Promise<Result<A, E>>`, where:

* `Ok<A>` is `A & { readonly success: true; readonly failure: false; readonly value: A }`
* `Err<E>` is `E & { readonly success: false; readonly failure: true; readonly error: E }`

This lets callers branch using either `if (result.success)` or `if (result.failure)`, while preserving the original top-level tagged payload. Existing `_tag` checks and `isX(...)` type guards therefore continue to work unchanged.

The entry point into the safe functions is `src/safe.ts`.

### "Unsafe" functions

For developers who prefer the traditional try/catch style of coding, we offer "unsafe" variants of the functions. These are also exposed in the module's `index.ts` file e.g. `exchangeCodeUnsafe` in `src/principal/index.ts`, returns a `Promise<A>` but potentially throws something of type `E`.

The entry point into the unsafe functions is `src/index.ts`.

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

After making code changes run `pnpm run typecheck` to ensure TypeScript is happy. `pnpm run test:all` should also be run after significant code changes.

[effect]: https://effect.website
[platform]: https://effect.website/docs/platform/introduction/
[micro]: https://effect.website/docs/micro/new-users/
[schema]: https://effect.website/docs/schema/introduction/
[effect-http]: https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#overview-1

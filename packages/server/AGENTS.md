## Overview

This library allows developers to interact with the Passlock API in backend/server-side code. It includes functions for verifying frontend registration and authentication operations performed using the [@passlock/browser](../browser/) project. It also includes functions to manage passkeys in the Passlock vault along with other capabilities.

## Project structure

* `src/mailbox` - mailbox ownership verification (one time login/verification codes)

* `src/passkey` - passkey management

* `src/principal` - verifying passkey registration and authentication operations performed by the `@passlock/browser` library. 

* `src/schemas` - Effect schemas representing the various types that can be returned by the Passlock REST API (private repo).

* `src/network.ts` - Utility functions for making fetch calls.

## Coding standards

We prefer a functional programming style, our preferred library is [Effect][effect]. We recognise that most consumers of this library will not use Effect, therefore we expose two Promise based entrypoints into the library in addition to an Effect based entrypoint

### "Safe" functions

These safe entrypoints return result envelopes over the original payloads. For example, given the function `exchangeCode` in `src/principal/principal.ts` returning an `Effect<A, E>`, we expose an `exchangeCode` in `src/safe.ts` returning a `Promise<Result<A, E>>`, where:

* `Ok<A>` is `A & { readonly success: true; readonly failure: false; readonly value: A }`
* `Err<E>` is `E & { readonly success: false; readonly failure: true; readonly error: E }`

This lets callers branch using either `if (result.success)` or `if (result.failure)`, while preserving the original top-level tagged payload. Existing `_tag` checks and `isX(...)` type guards therefore continue to work unchanged.

The entry point into the safe functions is `src/safe.ts`.

### "Unsafe" functions

For developers who prefer the traditional try/catch style of coding, we offer "unsafe" variants of the functions. These are also exposed in the module's `index.ts` file e.g. `exchangeCodeUnsafe` in `src/principal/index.ts`, returns a `Promise<A>` but potentially throws something of type `E`.

The entry point into the unsafe functions is `src/index.ts`.

### Effectful functions

We also expose Effect based functions in `src/effect.ts`.

### Functional parity across entrypoints

Wherever possible we aim for functional parity / alignment across the Safe, Unsafe and Effect APIs. `src/surface.test.ts` ensures this.

## Test suite location

Wherever possible we try to co-locate module code and tests alongside each other e.g. `src/passkey/registration/registration.ts` and  `src/passkey/registration/registration.test.ts`. The exception is shared test fixtures and helpers that would sit in the `test/*` directory.

## JSDoc / Typedoc

We use JSDoc comments alogn with [Typedoc][typedoc] to document the codebase. This is especially important for classes, functions and types exported directly or indirectly from one of the entrypoints.

## Build and test commands

We largely rely on pnpm scripts for build and test:

* `pnpm run build` - Invoke TSC to compile the project

* `pnpm run typecheck` - Invoke TSC to typecheck the project

* `pnpm run test:unit` - Runs the unit tests

* `pnpm run test:integration` - Runs the integration tests

* `pnpm run test:all` - Runs the unit and integration tests

* `pnpm run format` - Format using Biome.js

* `pnpm run lint:fix` - Lint using Biome.js and attempt to fix any issues

* `pnpm run typedoc` - Generate the JSDoc

## Important

Do this after all code changes:

1. Run `pnpm run typecheck`
2. Run `pnpm run format`
3. Run `pnpm run lint:fix`
4. Run `pnpm run test:all`
5. Run `pnpm run typedoc`

Address any warnings or errors.

[effect]: https://effect.website
[platform]: https://effect.website/docs/platform/introduction/
[micro]: https://effect.website/docs/micro/new-users/
[schema]: https://effect.website/docs/schema/introduction/
[effect-http]: https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#overview-1
[typedoc]: https://typedoc.org

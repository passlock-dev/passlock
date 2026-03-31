## Overview

This library allows developers to interact with the Passlock API in frontend/browser code. It includes functions that interact with the Passlock API. As this library will be used in frontend code it **should not** require or expose API keys or other secrets. §

## Coding standards

Most functions are developed using a subset of the [Effect][effect] framework, specifically the [Micro][micro] framework. As this library will be installed and bundled into client-side code, we try to keep the dependencies to a minimum. That's why we **DO NOT** use tools like [Effect Schema][schema], [Effect HTTP][effect-http] or Effect RPC in this project.

### "Safe" functions

Developers using the `@passlock/client` library will most likely not be using the Effect framework, so we expose Promise-based variants of public functions. For tagged success/error APIs, the safe entrypoint returns result envelopes over the original payloads. For example, given a function like `registerPasskey` in `src/passkey/registration/registration.ts` returning a `Micro<A, E>`, the `src/safe.ts` entrypoint exposes a `registerPasskey` returning `Promise<Result<A, E>>`, where:

* `Ok<A>` is `A & { readonly success: true; readonly failure: false; readonly value: A }`
* `Err<E>` is `E & { readonly success: false; readonly failure: true; readonly error: E }`

This lets callers branch using either `if (result.success)` or `if (result.failure)`, while the original success and error objects remain the top-level values. Existing `_tag` checks and the current `isX(...)` type guards therefore continue to work.

The entry point to the safe functions is `src/safe.ts`, this is exported via the package.json `exports` field.

### "Unsafe" functions

For developers who prefer the traditional try/catch style of coding, we offer "unsafe" variants of the functions. These are also exposed in the module's `index.ts` file e.g. `registerPasskeyUnsafe` in  `src/passkey/registration/index.ts`, returns a `Promise<A>` but potentially throws something of type `E`.

The entry point for the unsafe functions is `src/index.ts`.

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

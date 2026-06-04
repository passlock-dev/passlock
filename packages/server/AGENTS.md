## Overview

This library allows developers to interact with the Passlock API in backend/server-side code. It includes functions for verifying frontend registration and authentication operations performed using the [@passlock/browser](../browser/) project. It also includes functions to manage passkeys in the Passlock vault along with other capabilities.

## Coding standards

We prefer a functional programming style, our preferred library is [Effect][effect]. We recognise that most consumers of this library will not use Effect, therefore we expose Promise based entrypoints.

### "Safe" functions

These safe entrypoints return result envelopes over the original payloads. For example, given the function `exchangeCode` in `src/principal/principal.ts` returning an `Effect<A, E>`, we expose an `exchangeCode` in `src/safe.ts` returning a `Promise<Result<A, E>>`, where:

* `Ok<A>` is `A & { readonly success: true; readonly failure: false; readonly value: A }`
* `Err<E>` is `E & { readonly success: false; readonly failure: true; readonly error: E }`

This lets callers branch using either `if (result.success)` or `if (result.failure)`, while preserving the original top-level tagged payload. Existing `_tag` checks and `isX(...)` type guards therefore continue to work unchanged.

The entry point into the safe functions is `src/safe.ts`.

### Functional parity across entrypoints

Wherever possible we aim for functional parity / alignment across the Safe and Unsafe public APIs. `src/surface.test.ts` ensures this.

## Test suite location

Wherever possible we try to co-locate module code and tests alongside each other. The exception is shared test fixtures and helpers that would sit in the `test/*` directory.

## JSDoc / Typedoc

We use JSDoc comments along with [Typedoc][typedoc] to document the codebase. This is especially important for classes, functions and types exported directly or indirectly from one of the entrypoints.

## Testing and validation

- Unit tests typically live alongside code as `*.test.ts`.
- After code changes, run the smallest relevant validation first, then finish with `pnpm run typecheck`
- Run `pnpm run format` and `pnpm run lint:fix` and ensure the code meets the standards
- Run `pnpm run typedoc` to generate the developer docs
- Finally run `pnpm run build`

[effect]: https://effect.website
[platform]: https://effect.website/docs/platform/introduction/
[typedoc]: https://typedoc.org

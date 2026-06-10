## Overview

This library allows developers to interact with the Passlock API in frontend/browser code. It includes functions that interact with the Passlock API. As this library will be used in frontend code it **should not** require or expose API keys or other secrets.

## Coding standards

Most functions are developed using a subset of the [Effect][effect] framework, specifically the [Micro][micro] framework. As this library will be installed and bundled into client-side code, we try to keep the dependencies to a minimum. That's why we **DO NOT** use tools like [Effect Schema][schema], [Effect HTTP][effect-http] or Effect RPC in this project.

### "Safe" functions

Developers using the `@passlock/browser` library will most likely not be using the Effect framework, so we expose Promise-based variants of public functions. For tagged success/error APIs, the safe entrypoint returns result envelopes over the original payloads. For example, given a function like `registerPasskey` in `src/passkey/registration/registration.ts` returning a `Micro<A, E>`, the `src/index.ts` entrypoint exposes a `registerPasskey` returning `Promise<Result<A, E>>`, where:

* `Ok<A>` is `A & { readonly success: true; readonly failure: false; readonly value: A }`
* `Err<E>` is `E & { readonly success: false; readonly failure: true; readonly error: E }`

This lets callers branch using either `if (result.success)` or `if (result.failure)`, while the original success and error objects remain the top-level values. Existing `_tag` checks and the current `isX(...)` type guards therefore continue to work.

The entry point to the safe functions is `src/index.ts`.

### Public surface

`src/surface.test.ts` ensures the root package exports the Promise-based safe API.

## Test suite location

Wherever possible we try to co-locate module code and tests alongside each other. The exception is shared test fixtures and helpers that would sit in the `test/*` directory.

## JSDoc / Typedoc

We use JSDoc comments alogn with [Typedoc][typedoc] to document the codebase. This is especially important for classes, functions and types exported directly or indirectly from one of the entrypoints.

## Testing and validation

- Unit tests typically live alongside code as `*.test.ts`.
- After code changes, run the smallest relevant validation first, then finish with `pnpm run typecheck`
- Run `pnpm run format` and `pnpm run lint:fix` and ensure the code meets the standards
- Run `pnpm run typedoc` to generate the developer docs
- Finally run `pnpm run build`

[effect]: https://effect.website
[platform]: https://effect.website/docs/platform/introduction/
[micro]: https://effect.website/docs/micro/new-users/
[schema]: https://effect.website/docs/schema/introduction/
[effect-http]: https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#overview-1
[typedoc]: https://typedoc.org

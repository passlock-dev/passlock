## Overview

The `@passlock/client` library is the primary library for interacting with Passlock in frontend code. It includes functions for registering and authenticating passkeys on a device. This client library typically generates codes and id tokens, which are sent to the backend to be verified using the [@passlock/node](../node/) library.

## Project structure

* `src/logger` - a microservice definition (Context.Tag) that provides a logging capability, along with two implementations. The ConsoleLogger logs to the browser console, whereas the EventLogger fires DOM events for each log entry.

* `src/passkey` - Registering, authenticating and managing passkeys on a device.

* `src/shared` - Utility functions and types

## Preferred frameworks

Most functions are developed using a subset of the [Effect][effect] framework, specifically the [Micro][micro] framework. As this library will be installed and bundled into client-side code, we try to keep the dependencies to a minimum. That's why we **DO NOT** use tools like [Effect Schema][schema], [Effect HTTP][effect-http] or Effect RPC in this project.

### "Safe" functions

Developers using the `@passlock/client` library will most likely not be using the Effect framework, so we expose regular Promise-based variants of public functions. e.g. given the function `registerPasskey` in `src/passkey/registration/registration.ts` returning a `Micro<A, E>`, we create a function `registerPasskey` in `src/passkey/registration/index.ts` returning a `Promise<A | E>`.

We also offer type guards to enable developers to narrow something of type `A | E` down to an `A` or `E`. 

### "Unsafe" functions

For developers who prefer the traditional try/catch style of coding, we offer "unsafe" variants of the functions. These are also exposed in the module's `index.ts` file e.g. `registerPasskeyUnsafe` in  `src/passkey/registration/index.ts`, returns a `Promise<A>` but potentially throws something of type `E`.

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
[micro]: https://effect.website/docs/micro/new-users/
[schema]: https://effect.website/docs/schema/introduction/
[effect-http]: https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#overview-1

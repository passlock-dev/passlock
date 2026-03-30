## Overview

The `@passlock/sveltekit-example` project is a SvelteKit app. It illustrates how the `@passlock/client` and `@passlock/server` packages can be applied to add authentication to a SvelteKit app.

## Purpose

This app serves as a learning resource for developers and agents who want to use Passlock in their apps.

## Comments and JSDoc

Given the intended audience, we want to include helpful JSDoc and comments where appropriate.

## Project structure

- `src/lib/client` - Code intended to run client side, but could also run on the server during SSR/SSG rendering. This code should use the `@passlock/client` library, it **should not** use `@passlock/server` or make authenticated REST calls to the Passlock API.

- `src/lib/server` - Server side code responsible for verifying passkey registration and authentication operations, managing passkeys in the Passlock vault and other tasks. This code will generally use the `@passlock/server` library, it **should not** use `@passlock/client`.

- `src/lib/server/dbSchema.ts` - The [Drizzle ORM][drizzle] schema.

- `src/lib/shared` - Typically [Valibot][valibot] schemas and typed routes. Used by client and server side code.

### Routes

- `/account` - Account management including name and email changes along with account deletion.

- `/login` - Login related routes

- `/passkeys` - Registration and deletion of passkeys. Note: updates to passkey usernames/display names happen via the `/account` routes.

- `/signup` - Account creation/registration

### +server.ts endpoints

We have several `/+server.ts` endpoints. The general pattern is:

1. A `+page.svelte` template calls a function in `src/lib/client/**`.

2. The function performs client side operations and makes FETCH calls to a `+server.ts` endpoint.

3. The `+server.ts` endpoints makes calls to `src/lib/server/**` functions, returning a JSON response to the client.

4. The contract between the client and server code is enforced by HTTP status codes (200 for success, non-200 for failure) and a shared [Valibot][valibot] schema.

## Database

We use [Drizzle ORM][drizzle] with a [SQLite][sqlite] database.

Don't worry about supporting/migrating existing data in the database. This is a sample project/learning resource, not a production app so it's quite acceptable to drop and re-create the database during development.

## Build and test commands

We largely rely on pnpm scripts for build and test:

- `pnpm run typecheck` - Invoke TSC to typecheck the project

- `pnpm run format` - Format using Biome.js

- `pnpm run lint:fix` - Lint using Biome.js and attempt to fix any issues

- `pnpm run db:push` - Used to migrate the dev database.

## Important

After making code changes run `pnpm run typecheck` to ensure SvelteKit is happy.

Execute `pnpm run format` and `pnpm run lint:fix` to ensure the formatting and linting rules have been followed.

If you change `dbSchema.ts` run `pnpm run db:push` to migrate the dev database.

[valibot]: https://valibot.dev
[drizzle]: https://orm.drizzle.team
[sqlite]: https://orm.drizzle.team/docs/get-started-sqlite

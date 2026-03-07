# Sample SvelteKit app using Passlock + Lucia

SvelteKit app using passkeys alongside passwords for authentication. 

## Key features

1. Progressive enhancement - Supports passkeys alongside existing/legacy password based authentication.
2. Platform data - Informs users which platform/ecosystem each passkey belongs to.
3. Lucia sessions - Session management following the [Lucia][lucia] recommendations.
4. Local passkey updates - Updates the passkey account name on users' local devices/password managers.
5. Local passkey deletion - Prevents orphaned passkeys by deleting passkeys on the users' device.

## Scope

This is not intended to be a "batteries included" starter project. It's purpose is to illustrate how to implement passkey authentication in a real SvelteKit app. Run it locally, examine the code, use it as inspiration in your own project(s).

## Frameworks and libraries used

* [Superforms][superforms]
* [Tailwind CSS][tailwind]
* [Daisy UI][daisyui]
* [DrizzleORM][drizzle]

## Getting started

### Download this project

Use the [download-directory][download-directory] tool to download [this project][download-directory] from GitHub.

### Install the dependencies

`npm install`

### Setup Passlock

Create a Passlock environment:

`npx @passlock/cli init`

Follow the prompts and take note of your `Tenancy ID` and `API Key`.

### Create a .env file

Copy the `.env.example` to `.env` and set the `PUBLIC_PASSLOCK_TENANCY_ID` and `PASSLOCK_API_KEY` variables.

### Setup the database

Create a local SQLite database:

`npm run db:push`

### Run the app

`npm run dev`

[lucia]: https://lucia-auth.com
[superforms]: https://superforms.rocks
[tailwind]: https://tailwindcss.com
[daisyui]: https://daisyui.com
[drizzle]: https://orm.drizzle.team
[passlock-client]: https://www.npmjs.com/package/@passlock/client
[passlock-node]: https://www.npmjs.com/package/@passlock/node
[download-directory]: https://download-directory.github.io/?url=https://github.com/passlock-dev/passlock/tree/master/examples/sveltekit
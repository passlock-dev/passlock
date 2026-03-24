# Sample SvelteKit app using Passlock + Lucia

SvelteKit app using passkeys alongside email one-time codes for authentication.

![passlock-sample-screenshot](https://github.com/user-attachments/assets/77306736-4930-4045-9afd-ae3298eb768e)

## Key features

1. **Progressive enhancement** - Supports passkeys alongside email one-time-code authentication
2. **Platform data** - Informs users which platform/ecosystem each passkey belongs to
3. **Lucia sessions** - Session management following the [Lucia][lucia] recommendations
4. **Local passkey updates** - Updates the passkey account name on users' local devices/password managers
5. **Local passkey deletion** - Prevents orphaned passkeys by deleting passkeys on the users' device

## Scope

This is not intended to be a "batteries included" starter project. It's purpose is to illustrate how to implement passkey authentication in a real SvelteKit app. Run it locally, examine the code, use it as inspiration in your own project(s).

## Frameworks and libraries used

- [Superforms][superforms]
- [Tailwind CSS][tailwind]
- [Daisy UI][daisyui]
- [DrizzleORM][drizzle]

## Getting started

### 1. Download this project

Use the [download-directory][download-directory] tool to download [this directory][download-directory] from GitHub.

### 2. Install the dependencies

```bash
npm install
```

### 3. Setup Passlock

Create a Passlock environment:

```bash
npx @passlock/cli init
```

Follow the prompts and take note of your `Tenancy ID` and `API Key`.

### 4. Set environment variables

Copy the `.env.example` to `.env` and set the `PUBLIC_PASSLOCK_TENANCY_ID` and `PASSLOCK_API_KEY` variables.

### 5. Setup the database

Create a local SQLite database:

```bash
npm run db:push
```

### 6. Start the dev server

```bash
npm run dev
```

[lucia]: https://lucia-auth.com
[superforms]: https://superforms.rocks
[tailwind]: https://tailwindcss.com
[daisyui]: https://daisyui.com
[drizzle]: https://orm.drizzle.team
[passlock-client]: https://www.npmjs.com/package/@passlock/client
[passlock-server]: https://www.npmjs.com/package/@passlock/server
[download-directory]: https://download-directory.github.io/?url=https://github.com/passlock-dev/passlock/tree/master/examples/sveltekit

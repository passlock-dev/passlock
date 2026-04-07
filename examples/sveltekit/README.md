# Sample SvelteKit app demonstrating advanced authentication strategies

SvelteKit app using passkeys and email based one-time codes for authentication.

![passlock-sample-screenshot](https://github.com/user-attachments/assets/77306736-4930-4045-9afd-ae3298eb768e)

## Authentication features

1. **Advanced passkey support** - See below
2. **Progressive enhancement** - One time login codes for users who can't authenticate using passkeys
3. **Mailbox verification** - "Verify your email" messages ensure the user owns the claimed email
4. **Lucia sessions** - Session management following the [Lucia][lucia] recommendations
5. **Re-authentication** - Re authenticate users for sensitive operations e.g. account changes
6. **Account management** - Enables users to change their username/account email. Verifies email ownership and updates any associated passkeys

## Passkey features

1. **Two step login flow** - Prompt the user for their email then [drop into passkey auth][two-step-login] if they have a passkey. Pre-selects the passkey for the given account identifier
2. **Autofill** - Alternatively use browser [autofill][autofill] for progressive passkey enhancement during login
3. **Passkey management** - Allow users to create and delete account passkeys
4. **Local device management** - Sync passkey deletion or account username/email changes with the user's [local device / passkey manager][credential-updates]
5. **Local re-authentication** - Sensitive operations require the user to [re-authenticate][user-verification] against their device e.g. using FaceID

## Scope

This is not intended to be a "batteries included" starter project. It's purpose is to illustrate how to implement passkey authentication in a real SvelteKit app. Run it locally, examine the code, use it as inspiration in your own project(s) 🚀

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
[autofill]: https://passlock.dev/passkeys/autofill/
[credential-updates]: https://passlock.dev/passkeys/credential-updates/
[two-step-login]: https://passlock.dev/passkeys/authentication-patterns/#single-factor-two-step-authentication
[user-verification]: https://passlock.dev/passkeys/user-verification/

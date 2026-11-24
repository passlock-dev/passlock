# Sample SvelteKit app demonstrating advanced authentication strategies

SvelteKit app using passkeys, email based one-time codes, and optional authenticator apps for authentication.

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

## Authenticator apps (TOTP)

The account menu's **Authenticators** page demonstrates enrollment, confirmation,
status reconciliation, and removal using the class-based `Passlock` server SDK.
The browser calls this application's own endpoints; the API key stays on the server.

### Sign-in and recovery policy

- Email sign-in requires an authenticator code after the first enrollment is
  confirmed. Starting enrollment alone does not enable the second step.
- Passkeys are optional: users can enroll TOTP without registering a passkey,
  and can delete their passkeys while keeping TOTP enabled. A verified,
  user-verified passkey belonging to the account remains an independent sign-in method.
- Enrollment and management require a full session. Accounts with passkeys also
  require recent passkey confirmation.
- Account deletion removes the user's passkeys and TOTP enrollments, deletes their local account
  and sessions, and forwards the Server SDK's deletion response to the browser. The Browser SDK
  uses that response to ask the device's password manager to remove the deleted passkeys.
- If you lose your authenticator and have a passkey, sign in with it, open **Authenticators**,
  and remove the lost authenticator. You can enroll and confirm a replacement
  before removing the old one. Removal of the last authenticator turns off the
  second step for email sign-in. There are no recovery codes or atomic replacement.
- Email alone cannot recover an account that requires TOTP. Losing access to all
  authenticators without an available passkey requires an application-specific,
  separately verified support recovery process; this sample does not implement one.

After successful email verification, the server chooses the account's policy in a
SQLite transaction. Accounts requiring TOTP receive an opaque, HTTP-only pending
login cookie, **not a session**. Only its hash is stored, with a five-minute absolute
deadline, five verification submissions, and a snapshot of the allowed authenticators.
There is one pending login per account; a newer email login replaces the old one.
Only one verification can run at a time. Successful verification consumes pending
state and creates the session in one transaction. Expiry, credential changes, and
unknown verification outcomes cannot grant access. A replay error never means success.

### Setup handling and errors

The enrollment response contains a QR image and manual setup key, displayed only
in memory until confirmation, cancellation, expiry, or leaving the page. These
values are absent from the database, cookies, page loaders, browser storage, and
logs. TOTP routes return `Cache-Control: no-store` and `Referrer-Policy: no-referrer`;
QR codes use local PNG data URLs. Refreshing loses setup: remove the pending
enrollment and start again.

Codes remain strings so leading zeros survive. The UI handles invalid or reused
codes, enrollment expiry, and rate limits without automatic retries. If confirmation
has an uncertain outcome, the account conservatively requires MFA until **Check
enrollment status** succeeds or an authorized removal completes. This status check
does not submit the code again. An uncertain login verification requires starting
a fresh login or using a passkey, if registered.

All state-changing requests require an exact same-origin `Origin` header, including
JSON endpoints. Ownership comes from the signed-in session or pending login, never
a submitted user ID. The server repeats all authorization checks.

### Development

Authenticator enrollment is available to every account. Email sign-in requires
an authenticator code once an enrollment is confirmed.

Run `pnpm run db:push` after updating the schema. Use a server SDK build containing
the TOTP methods; in the monorepo, build `packages/server` before building this app.
`pnpm run test:totp` uses an in-memory database and mocked SDK responses. It
exercises pending-login isolation, failure cases, request security, TOTP enrollment
and management without passkeys, and the actual passkey sign-in route without
calling Passlock.

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

Copy the `.env.example` to `.env` and set the `PUBLIC_PASSLOCK_TENANCY_ID`,
`PASSLOCK_API_KEY`, and `PASSLOCK_RP_ID` variables. `PASSLOCK_RP_ID` is the
backend-selected relying party ID sent when the example authorizes passkey
registration and authentication.

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
[passlock-browser]: https://www.npmjs.com/package/@passlock/browser
[passlock-server]: https://www.npmjs.com/package/@passlock/server
[download-directory]: https://download-directory.github.io/?url=https://github.com/passlock-dev/passlock/tree/master/examples/sveltekit
[autofill]: https://passlock.dev/passkeys/autofill/
[credential-updates]: https://passlock.dev/passkeys/credential-updates/
[two-step-login]: https://passlock.dev/passkeys/authentication-patterns/#single-factor-two-step-authentication
[user-verification]: https://passlock.dev/passkeys/user-verification/

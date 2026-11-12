<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Server-side library to accompany the <a href="https://www.npmjs.com/package/@passlock/browser">@passlock/browser</a> package
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
    ·
    <a href="#{DEMO}#">Demo</a>   
  </p>
</div>

<br />

## See also

For frontend usage please see the accompanying [@passlock/browser][browser] package

## Requirements

Node 20+ (If running Node)

## Usage

### Authorize a passkey registration

Create passkey registrations from your backend after you have authenticated the
user and decided they are allowed to add a passkey. The server authorizes a
short-lived `registrationToken` for the `rpId` and `rpName` your backend
supplies; send only that token to the browser and use it with `registerPasskey`
from `@passlock/browser`.

Choose `rpId` in your backend for each prepared ceremony. It is not configured
through tenancy passkey settings.

```ts
import { authorizePasskeyRegistration } from "@passlock/server"

const result = await authorizePasskeyRegistration(
  {
    rpId: "example.com",
    rpName: "Example App",
    userId: "user_123",
    username: "user@example.com",
    displayName: "User Example",
  },
  {
    apiKey: process.env.PASSLOCK_API_KEY!,
    tenancyId: "your-tenancy-id",
  }
)

if (result.success) {
  return {
    registrationToken: result.value.registrationToken,
  }
}

throw new Error(result.error.message)
```

The authorized registration token authorizes one browser registration ceremony for
the authorized user. Treat it as bearer authorization, do not log it, and discard
it after it is sent to the browser.

Please see the [Quick start guide](#{TUTORIAL}#) for a complete registration
and verification flow.

## TOTP authenticators

TOTP support requires a compatible API deployment with TOTP enabled for your
tenancy. Installing the SDK does not enable the feature. A disabled or unrecognized
route remains an unexpected failure that rejects the Promise. Custom `endpoint`
values must point to an API that supports these operations.

Use the `Passlock` client from your backend. Keep the API key on the server; the
browser submits codes to your application, which checks account ownership and
calls Passlock. No browser SDK is needed for TOTP.

| Method                     | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `createTotpAuthenticator`  | Create a pending authenticator and return setup material once. |
| `confirmTotpAuthenticator` | Confirm enrollment with the first valid code.                  |
| `verifyTotp`               | Verify and durably consume a code for an active authenticator. |
| `getTotpAuthenticator`     | Read one authenticator within a user/tenancy scope.            |
| `listTotpAuthenticators`   | Read a page; pass the returned cursor until it is `null`.      |
| `deleteTotpAuthenticator`  | Remove an authenticator; repeated deletion returns `NotFound`. |

Every method also has a standalone function with the same name, accepting
operation options first and `AuthenticatedOptions` second. Class methods take
only the operation options.

### Enrollment

```ts
import { Passlock } from "@passlock/server"

const passlock = new Passlock({
  tenancyId: process.env.PASSLOCK_TENANCY_ID!,
  apiKey: process.env.PASSLOCK_API_KEY!,
})

// Resolve this account from your authenticated server session.
const enrollment = await passlock.createTotpAuthenticator({
  userId: account.id,
  issuer: "Example App",
  username: account.email,
  displayName: "Work phone",
})

if (enrollment.success) {
  // Bind this ID to the account's enrollment flow on your server.
  const authenticatorId = enrollment.value.authenticator.id
  // Send setup only to that account's enrollment UI with Cache-Control: no-store.
  const { secret, uri, qrCodeDataUrl } = enrollment.value.setup
}

// In a later request, validate that the enrollment belongs to this session.
const confirmation = await passlock.confirmTotpAuthenticator({
  userId: account.id,
  authenticatorId: enrollmentState.authenticatorId,
  code: submittedCode, // A string from a text input; preserve leading zeroes.
})
```

`secret` is an unpadded Base32 secret, `uri` is an `otpauth://totp` URI, and
`qrCodeDataUrl` is a PNG data URL. The QR code encodes the same URI. Render it
locally; do not send the URI to a remote QR service. A restrictive CSP must allow
`data:` in `img-src`, or your application can serve the image through an
authenticated, non-cacheable route. Never log setup material or submitted codes,
put them in analytics, or store them in public image hosting.

Setup is returned only by creation. Get/list never recover it. If creation's
response is lost, abandon or delete that pending enrollment and start a new one.
Do not blindly retry creation: an interrupted response may follow a committed
creation. Confirmation activates the authenticator but does not create a
principal, token or application session.

### Verification and ownership

```ts
// pendingLogin is trusted server state for this specific restricted login flow.
const result = await passlock.verifyTotp({
  userId: pendingLogin.userId,
  authenticatorId: pendingLogin.authenticatorId,
  code: submittedCode,
})

if (result.success) {
  // Finish only the login/action bound to pendingLogin after all other checks.
  // result.value contains userId, authenticatorId and verifiedAt, not a session.
} else if (result.error._tag === "@error/TotpRateLimited") {
  const retryAfterSeconds = result.error.retryAfterSeconds
  // Tell the user when they may try again; do not automatically resubmit a code.
} else {
  // Handle the typed error; do not treat it as successful authentication.
}
```

Derive `userId` from trusted account/session state, not a browser-selected account.
Check that `authenticatorId` belongs to that account's pending login or management
flow. Passlock scopes every operation to the configured tenancy and exact user ID;
a missing credential and one outside that scope both return `NotFound`. A successful
verification consumes the code step. Reuse returns `TotpCodeAlreadyUsed`, including
when a later accepted step has invalidated the submitted step. There is no successful
`valid: false` result. An unknown network outcome must not be treated as success.

`userId` is an opaque, case-sensitive 1–256 UTF-8-byte application account key;
whitespace-only values and control characters are rejected. It is not an email
address or a Passlock user record. The SDK does not trim or normalize it. `issuer`
and `username` are authenticator labels: the server trims them, enforces 1–128
UTF-8 bytes, and rejects colons/control characters. Optional `displayName` is a
trimmed nickname of 1–120 UTF-8 bytes. Null options, unknown fields, malformed
15-character lowercase alphanumeric authenticator IDs and non-ASCII codes fail
validation. Keep codes as exact strings; do not trim, coerce numbers, or normalize
digits. Do not log raw user IDs, labels, cursors or API credentials.

### Settings and lifecycle

| Setting               | Default                     | Supported values                   |
| --------------------- | --------------------------- | ---------------------------------- |
| `totp.algorithm`      | `SHA1`                      | `SHA1`, `SHA256`, `SHA512`         |
| `totp.digits`         | `6`                         | `6`, `8`                           |
| `totp.period`         | `30` seconds                | `30`, `60`                         |
| `verification.window` | `1` adjacent step each side | `0`, `1`                           |
| `enrollmentExpiresIn` | `900` seconds               | Integers from `300` through `1800` |

Omitted values (including empty nested objects) use server defaults. Records return
resolved settings. Non-default settings can be ignored by some authenticator apps;
confirmation checks the enrolled app's compatibility. Settings are fixed for that
enrollment; changing them requires a new authenticator. Verification accepts no
client timestamp, secret, algorithm, window or rate-limit bypass option.

All returned timestamps are integer Unix **milliseconds**; durations are integer
**seconds**. Pending records expose `expiresAt`, an exclusive enrollment deadline.
Get/list immediately hide expired pending records. Confirmation reports
`TotpEnrollmentExpired` for 24 hours after expiry, then `NotFound`. During that
interval deletion is allowed and verification reports `TotpAuthenticatorNotActive`.
Active records expose `confirmedAt` and optional `lastUsed`; `lastUsed` records
successful authentication, not enrollment confirmation. Active authenticators do
not expire at the original enrollment deadline.

### Results and failures

Operations return `Promise<Result<Success, OperationError>>`. Use `success`/`value`
or `failure`/`error`; the original top-level fields and `_tag` remain available,
along with `isTotp...` guards. `Unauthorized` (401) means missing/malformed API
credentials; `Forbidden` (403) means invalid credentials. Invalid request shapes
and `InvalidTotpCode` map to 400, scoped `NotFound` to 404, lifecycle/reuse/quota
conflicts to 409, enrollment expiry to 410, and rate limits to 429.
`TotpAuthenticatorLimit` includes `limit` and `kind` (`active` or `pending`).
`TotpRateLimited` includes a positive integer `retryAfterSeconds`.

Unexpected transport errors, malformed responses, disabled routes and server 5xx
responses reject the Promise rather than becoming expected domain failures. TOTP
transport exceptions omit raw URLs and response/request contents. The SDK sends
mutations once, refuses redirects and does not automatically retry. After an
ambiguous confirmation, verification or deletion result, reconcile the application
flow; never infer that the operation failed to commit or grant access speculatively.
A replay error after a lost verification response is not proof of authentication.

[browser]: https://www.npmjs.com/package/@passlock/browser

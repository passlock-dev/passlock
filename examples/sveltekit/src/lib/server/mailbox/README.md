# Mailbox Verification

This directory contains the server-side building blocks for the sample app's
email one-time-code flows:

- signup verification
- login verification
- email-change verification

All three flows use Passlock mailbox challenges. The app creates a challenge,
emails the one-time code to the user, stores the challenge id and secret in an
HTTP-only cookie, and then verifies the submitted code against Passlock before
applying the local state change.

## End-to-end flow

The overall flow is the same for signup, login, and email change:

1. A route calls one of the `createOrRefresh*Challenge` helpers in this
   directory.
2. The helper creates a Passlock mailbox challenge with a `purpose`, optional
   `userId`, and flow-specific `metadata`.
3. The route sends the returned `code` by email and stores `{ challengeId,
secret }` in a short-lived HTTP-only cookie.
4. The verify-code page reloads the pending challenge from that cookie using
   `getPendingChallengeContext(...)`.
5. When the user submits the 6-digit code, the action combines:
   - the user-entered `code`
   - the cookie-backed `challengeId`
   - the cookie-backed `secret`
6. `verifyPasslockMailboxChallenge(...)` asks Passlock to verify the challenge.
7. The flow-specific `consume*Challenge` helper re-validates the returned
   challenge and then applies the local effect:
   - signup creates the local user
   - login resolves the existing local user
   - email change updates the signed-in user's email
8. On success the pending challenge cookie is cleared.

## Shared building blocks

### `mailboxChallenge.ts`

This file is the shared integration layer around `@passlock/server/safe`.

Key responsibilities:

- `getPasslockMailboxChallenge(...)` loads an existing challenge from Passlock.
- `createPasslockMailboxChallenge(...)` creates a challenge and normalises the
  rate-limit result.
- `verifyPasslockMailboxChallenge(...)` verifies a challenge and returns either
  `MailboxChallengeVerified` or a typed verification error.
- `validateMailboxChallenge(...)` applies app-level checks after loading or
  verifying a challenge:
  - `purpose` must match the current flow
  - `metadata` must match the expected Valibot schema
  - `processExpiresAt` must still be in range
- `parseChallengeUserId(...)` converts the Passlock `userId` binding into the
  local numeric user id used by the sample app.
- `createChallengeRateLimitView(...)` and
  `getChallengeCodeErrorMessage(...)` shape shared UI state.

### `pendingChallenge.ts`

`getPendingChallengeContext(...)` reconstructs the current in-progress mailbox
flow from the pending challenge cookie.

It returns a tagged union:

- `MissingPendingChallenge` when the cookie is absent
- `InvalidPendingChallenge` when the cookie points at a missing or invalid
  challenge
- `PendingChallenge` when both the cookie and the challenge are valid

Email change also supplies `validateChallenge(...)` so the pending challenge
must belong to the signed-in user.

### `verifyCode.ts`

This file contains the shared Valibot and Superforms setup for the 6-digit code
entry form used by all verification pages.

## Flow-specific modules

### `signupChallenge.ts`

Signup stores extra metadata in the challenge:

- `givenName`
- `familyName`
- `processExpiresAt`

Important types:

- `SignupChallenge`: the validated local view of a signup challenge
- `CreatedSignupChallenge`: the result returned after challenge creation
- `ConsumedChallenge`: the shared success result containing the resolved local
  `SessionUser`

`consumeSignupChallenge(...)` verifies the Passlock challenge, re-checks that
the email is still unused, creates the local user, and returns the new session
user.

### `loginChallenge.ts`

Login uses only the shared base metadata:

- `processExpiresAt`

Important types:

- `LoginChallenge`: the validated local view of a login challenge
- `CreatedLoginChallenge`: creation result used to send the email and set the
  pending cookie
- `ConsumedChallenge`: shared success result with the resolved local
  `SessionUser`

`consumeLoginChallenge(...)` verifies the Passlock challenge and maps it back to
an existing local account by email.

### `emailChange.ts`

Email change also uses the shared base metadata, but it additionally binds the
challenge to a Passlock `userId`. The sample app uses that binding to ensure
the verified challenge belongs to the currently signed-in user.

Important types:

- `EmailChangeChallenge`: validated local challenge including the bound numeric
  `userId`
- `CreatedEmailChangeChallenge`: creation result used to send the email and set
  the pending cookie
- `EmailChangeSuccess`: success result after the local email address has been
  updated

`consumeEmailChallenge(...)` verifies the challenge, checks ownership, checks
for duplicate email conflicts, updates the local account, and returns both the
updated user and the previous email address.

## Key external and local types

These are the main types worth understanding when working on mailbox
verification:

- `MailboxChallengeMetadata` from `@passlock/server/safe`: arbitrary metadata
  stored with the Passlock challenge when it is created
- `MailboxChallengeDetails`: the readable Passlock challenge payload returned by
  `getMailboxChallenge(...)`
- `MailboxChallengeVerified`: the verified Passlock payload returned after a
  successful code check
- `ChallengeRateLimitedError`,
  `InvalidChallengeError`,
  `InvalidChallengeCodeError`,
  `ChallengeExpiredError`,
  `ChallengeAttemptsExceededError`: typed Passlock error payloads re-exported by
  `mailboxChallenge.ts`
- `PendingChallengeCookie` from `src/lib/server/cookies.ts`: the local
  short-lived cookie payload storing the `challengeId` and `secret`
- `ChallengeRateLimitView` from `src/lib/shared/challengeRateLimit.ts`: the UI
  model used when challenge creation or resend is rate limited
- `SessionUser` from `src/lib/server/repository.ts`: the local user shape used
  after a challenge has been consumed

## Why `processExpiresAt` exists

Passlock already gives each challenge its own expiration window, but this sample
adds a separate `processExpiresAt` value inside challenge metadata.

That extra timestamp lets the app expire the whole local flow, not just the
emailed code. In practice that means:

- signup details can expire even if the Passlock code itself still exists
- login/email-change routes can reject stale pending flows consistently after a
  page reload
- the same validation logic works when reading an existing challenge and when
  verifying it

## Resend behaviour

The resend endpoints reuse the same primitives:

- they recover the current pending challenge with
  `getPendingChallengeContext(...)`
- they create a fresh challenge with the relevant `createOrRefresh*Challenge`
  helper
- they send a new email and replace the pending cookie using
  `resendMailboxChallenge(...)`

This keeps the resend routes thin while leaving all mailbox-specific validation
inside this directory.

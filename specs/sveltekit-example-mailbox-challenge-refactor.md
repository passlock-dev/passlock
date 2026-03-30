# SvelteKit Example Spec: Remove Local Mailbox Challenge State

## Goal

Refactor the SvelteKit example so mailbox challenge state is sourced from
Passlock instead of local SQLite challenge tables.

This spec assumes the following `@passlock/server` capabilities already exist:

- mailbox challenge metadata
- `getMailboxChallenge`
- verify returning the verified challenge
- `invalidateOthers` on challenge creation

## Desired Outcome

The SvelteKit example should no longer need local database tables for pending
signup, login, or email-change mailbox challenges.

The application should keep only the pending challenge cookie containing:

- `challengeId`
- `secret`

All other pending challenge state should be read from Passlock.

## Current Local State to Remove

The example currently stores pending mailbox challenge data in:

- `signup_challenges`
- `user_challenges`

Those tables are currently used for:

- trusted pending challenge lookup
- app-specific signup data storage
- app-specific flow expiry checks
- delete-and-replace semantics for older pending challenges

After the refactor, those responsibilities move to Passlock plus the
application's normal user database.

## Metadata Shape

The example should store app-defined metadata on mailbox challenges.

Suggested metadata:

- Signup:
  - `challengeExpiresAt`
  - `givenName`
  - `familyName`
- Login:
  - `challengeExpiresAt`
- Email change:
  - `challengeExpiresAt`

`challengeExpiresAt` remains an application rule, not a Passlock rule. The
example should validate it after reading or verifying a challenge.

## Repository Refactor

The repository layer in `examples/sveltekit/src/lib/server/repository.ts`
should be simplified so mailbox challenge operations no longer depend on local
challenge tables.

### Create Flow

When creating signup, login, or email-change challenges:

- call Passlock create with metadata
- pass `invalidateOthers: true`
- keep returning the created challenge plus `secret` and `code` for the current
  email delivery flow

Suggested metadata construction:

- Signup metadata comes from the submitted form plus a computed
  `challengeExpiresAt`
- Login metadata includes a computed `challengeExpiresAt`
- Email-change metadata includes a computed `challengeExpiresAt`

### Read Pending Challenge Flow

Replace local `getPending*Challenge` functions with Passlock-backed reads:

- fetch the cookie
- call `getMailboxChallenge(challengeId)`
- validate the returned `purpose`
- validate the returned `userId` when the flow is user-bound
- validate any required metadata shape

If the challenge is missing or invalid:

- delete the pending cookie
- redirect the user to restart the relevant flow

### Verify Flow

Change verify actions so they:

1. read the cookie
2. call Passlock verify with `challengeId`, `secret`, and `code`
3. receive the verified challenge from Passlock
4. validate `challengeExpiresAt` from metadata
5. continue the application flow or abort and redirect

This intentionally changes the previous ordering. The application-specific
expiry check happens after Passlock verification because the trusted challenge
payload comes back from Passlock at that point.

If `challengeExpiresAt` has passed after a successful Passlock verify:

- treat the flow as expired
- delete the pending cookie
- redirect the user to restart the flow

The verified challenge has already been consumed in Passlock, so restart is the
correct outcome.

## Route Changes

### Signup

`/signup` and `/signup/verify-code` should change as follows:

- Create signup challenges with metadata containing:
  - `givenName`
  - `familyName`
  - `challengeExpiresAt`
- Use `getMailboxChallenge` on page load and resend instead of reading from
  `signup_challenges`
- On verify success, read `givenName` and `familyName` from verified challenge
  metadata before creating the user

### Login

`/login`, `/login/email`, and `/login/email/verify-code` should change as
follows:

- Create login challenges with `challengeExpiresAt` metadata
- Use `getMailboxChallenge` for page load and resend checks
- Use the verified challenge returned by Passlock to recover the trusted email
  after verification

The login email template can still use the user record from the local users
table when sending the email.

### Email Change

`/account` and `/account/verify-email` should change as follows:

- Create email-change challenges with `challengeExpiresAt` metadata
- Use `getMailboxChallenge` for page load and resend checks
- Continue to authorize the flow by ensuring the challenge `userId` matches the
  logged-in user
- On verify success, use the verified challenge email to perform the update

## Database Changes

Update `examples/sveltekit/src/lib/server/dbSchema.ts` to remove:

- `signupChallengesTable`
- `userChallengesTable`

Update the repository implementation to remove local challenge CRUD and expiry
helpers that depend on those tables.

Because this is a sample app, it is acceptable to replace the local database
schema rather than migrate existing data.

## Cookie Handling

The pending challenge cookie format can stay unchanged:

- `challengeId`
- `secret`

No application metadata should be stored in the cookie.

## Reset Script

`examples/sveltekit/src/reset.ts` currently discovers remote challenge IDs from
the local challenge tables before deleting them. Once those tables are removed,
the reset script should no longer depend on local mailbox challenge records.

Options:

- simplest: stop deleting pending mailbox challenges during reset and rely on
  expiry plus `invalidateOthers`
- later enhancement: add a dedicated Passlock admin listing capability if
  challenge cleanup during reset remains important

## Validation Rules

The example should treat challenge metadata as trusted server-side state coming
from Passlock, but it should still validate the expected metadata shape before
using it.

Examples:

- `challengeExpiresAt` must be a number
- signup `givenName` must be a non-empty string
- signup `familyName` must be a non-empty string

Invalid metadata should be treated as an expired or invalid flow and should
restart the process safely.

## Expected Simplifications

After this refactor, the SvelteKit example should gain:

- fewer local tables
- fewer repository helpers
- no local delete-and-replace logic for pending challenges
- a single trusted source of pending challenge state

This makes the mailbox challenge flows easier to reason about and keeps the
example focused on application logic rather than challenge persistence.

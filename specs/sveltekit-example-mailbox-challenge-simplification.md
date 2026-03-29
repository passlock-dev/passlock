# Spec: SvelteKit Example Mailbox Challenge Simplification

## Summary

Refactor the SvelteKit example so that login and email-change mailbox challenges are no longer persisted in the local database.

After this change:

- signup challenge persistence remains local because `givenName` and `familyName` are not part of the Passlock mailbox challenge contract
- login and email-change flows rely on Passlock as the source of truth for challenge context
- the app still stores an `httpOnly` cookie containing only `challengeId` and `token`

This spec depends on the API contract described in `specs/passlock-api-mailbox-challenge-context.md`.

## Goals

- Remove the local `user_challenges` table and all repository logic that exists only to cache login and email-change challenge context.
- Preserve current UX:
  - verify pages can still display the target email before code submission
  - resend still works
  - restarting a flow invalidates the previous pending challenge
- Preserve current authorization behavior:
  - login resolves the account from trusted challenge context
  - email change validates the challenge `userId` against the authenticated session user

## Non-Goals

- Removing local signup challenge persistence.
- Changing the cookie shape beyond the existing `challengeId` and `token`.
- Adding a replacement cleanup store for login or email-change challenges.

## Required Changes

### 1. Keep the cookie contract unchanged

Do not change `PendingChallengeCookie`.

The cookie remains:

```ts
type PendingChallengeCookie = {
  challengeId: string
  token: string
}
```

This is already the current shape and is sufficient once Passlock can read and verify challenge context authoritatively.

### 2. Remove local persistence for login and email-change challenges

Delete `userChallengesTable` from the example database schema and remove all repository helpers that depend on it.

Remove:

- the `user_challenges` table from `src/lib/server/dbSchema.ts`
- local lookup helpers for login and email-change challenges
- local insert/delete logic for login and email-change challenge rows
- local expiry cleanup for login and email-change challenge rows

Keep:

- `signupChallengesTable`
- all signup-specific logic that stores `givenName` and `familyName`

### 3. Extend the Passlock wrapper layer

Update `src/lib/server/passlock.ts` to wrap the new Passlock API contract:

- `createMailboxChallenge` passes `invalidateExisting: true` for login, signup, and email-change flows
- add `readMailboxChallenge({ challengeId, token })`
- change `verifyMailboxChallenge` to require `challengeId`, `token`, and `code`

Normalize `userId` from Passlock responses into a local `number | null` shape where needed.

If the response is missing `userId` for login or email-change challenges, treat that as an invalid challenge and fail closed.

### 4. Split local signup challenge handling from remote challenge handling

Refactor the repository challenge model into two concepts:

- `SignupChallenge`: locally persisted signup-only context
- `RemoteMailboxChallenge`: canonical Passlock-backed context used for login and email-change

Do not continue using a single shared repository `Challenge` abstraction for both storage models.

### 5. Update login flow to use Passlock-backed context

#### Challenge creation

- `createOrRefreshLoginChallenge` still starts from a local account lookup by email so the example can redirect unknown users to signup.
- When creating the mailbox challenge, pass `invalidateExisting: true`.
- Do not insert a local challenge row.

#### Verify page load

- Replace `getPendingLoginChallenge(challengeId)` with `readMailboxChallenge({ challengeId, token })`.
- If the challenge cannot be read, clear the cookie and redirect to `/login`.
- Render the page email from the Passlock response.

#### Verify submit

- `consumeLoginChallenge` must call Passlock `verifyMailboxChallenge({ challengeId, token, code })`.
- On success, use the returned `challenge.userId` to load the account by id.
- Do not resolve the account by `challenge.email` first when `userId` is present.
- If no account exists for the returned `userId`, treat this as `ACCOUNT_NOT_FOUND`.

#### Resend

- Re-read the pending challenge from Passlock using `challengeId` and `token`.
- Recreate the login challenge using the canonical challenge email.
- Store the new `challengeId` and `token` in the cookie.

### 6. Update email-change flow to use Passlock-backed context

#### Challenge creation

- `createOrRefreshEmailChallenge` still validates the initiating user and target email locally before challenge creation.
- When creating the mailbox challenge, pass `invalidateExisting: true`.
- Do not insert a local challenge row.

#### Verify page load

- Replace `getPendingEmailChallenge(challengeId)` with `readMailboxChallenge({ challengeId, token })`.
- If the challenge cannot be read, clear the cookie and redirect to `/account`.
- Convert the returned `challenge.userId` to a number and require it to equal `locals.user.userId`.
- If it does not match, clear the cookie and redirect to `/account`.
- Render the page email from the Passlock response.

#### Verify submit

- `consumeEmailChallenge` must call Passlock `verifyMailboxChallenge({ challengeId, token, code })`.
- Require the verified challenge `userId` to equal the authenticated user id.
- Use the verified challenge `email` as the new account email.
- Continue performing the existing duplicate-email and account-exists checks locally before the update.

#### Resend

- Re-read the pending challenge from Passlock using `challengeId` and `token`.
- Recreate the challenge using the canonical pending email.
- Store the new `challengeId` and `token` in the cookie.

### 7. Leave signup flow locally persisted

Do not change the signup flow except for using `invalidateExisting: true` when creating the Passlock mailbox challenge.

Signup still needs local storage because the example must carry:

- `givenName`
- `familyName`

Those fields are required after successful code verification and are not present in the mailbox challenge contract.

### 8. Update reset and cleanup behavior

Update `src/reset.ts` to remove the dependency on `userChallengesTable`.

After this refactor:

- the reset script should continue deleting signup challenge rows from the local database
- the reset script should stop trying to enumerate login and email-change challenge ids from the database
- pending login and email-change challenges in Passlock are allowed to expire naturally

Do not add a new Passlock admin/list endpoint just to preserve reset cleanup in the example app.

### 9. Update comments and docs

Refresh inline comments and any example docs that currently imply all mailbox challenges are locally persisted.

The resulting explanation should be:

- signup challenges are locally persisted because they carry app-owned profile data
- login and email-change challenges are Passlock-backed and only tracked locally by cookie

## Testing and Acceptance Criteria

### Login flow

- Starting a login flow sets the cookie and does not create a local DB row.
- Loading `/login/email/verify-code` with a valid cookie renders the email returned by Passlock read.
- Loading the page with an invalid or expired challenge clears the cookie and redirects to `/login`.
- Resending a code replaces the cookie with a new `challengeId` and `token`.
- After resend, the previous challenge can no longer be verified.
- Successful verification logs the user in by resolving the account from the verified challenge `userId`.

### Email-change flow

- Starting an email-change flow sets the cookie and does not create a local DB row.
- Loading `/account/verify-email` with a valid cookie renders the target email returned by Passlock read.
- Loading the page with a challenge whose `userId` does not match the session clears the cookie and redirects to `/account`.
- Resending a code replaces the cookie with a new `challengeId` and `token`.
- After resend, the previous challenge can no longer be verified.
- Successful verification updates the current account email using the verified challenge `email`.

### Signup flow

- Signup still persists local challenge rows and still succeeds with `givenName` and `familyName`.
- Resending signup codes still works exactly as before.

### Database and cleanup

- `user_challenges` is removed from the schema and repository code.
- The app typechecks after the refactor.
- `pnpm run db:push` succeeds for the example after the schema change.

## Assumptions

- The Passlock API spec lands first.
- Passlock verify responses include canonical `id`, `purpose`, `email`, `userId`, `createdAt`, and `expiresAt`.
- Passlock read responses require both `challengeId` and `token`.
- A successful Passlock verify consumes the challenge, and `invalidateExisting: true` ensures older pending challenges stop working when a new one is created.

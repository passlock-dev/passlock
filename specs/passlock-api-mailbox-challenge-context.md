# Spec: Passlock Mailbox Challenge Context API

## Summary

This change makes Passlock the authoritative source of truth for mailbox challenge context in the login and email-change flows.

After this change, an application only needs to persist:

- `challengeId`
- `token`

It should no longer need a local database copy of the login or email-change challenge fields such as `email` or `userId`.

Signup-specific profile fields such as `givenName` and `familyName` are out of scope for this spec.

## Goals

- Allow apps to verify mailbox challenges without locally persisting login or email-change challenge context.
- Allow apps to re-read pending challenge context without mutating the challenge.
- Preserve the current "replace the previous challenge" behavior when a flow is restarted or a code is resent.
- Keep `token` and `code` out of non-create response payloads.

## Non-Goals

- Removing signup-specific local persistence from consumers.
- Adding challenge listing or bulk-admin endpoints.
- Changing passkey or non-mailbox APIs.

## Backend Contract Changes

### 1. Extend challenge creation to support invalidation of matching pending challenges

#### Endpoint

`POST /{tenancyId}/challenges`

#### Request

Add an optional boolean field:

```json
{
  "email": "alice@example.com",
  "purpose": "login",
  "userId": "123",
  "invalidateExisting": true
}
```

#### Semantics

- Default: `invalidateExisting` is `false`.
- When `invalidateExisting` is `true` and `userId` is present:
  Invalidate all unverified, unexpired challenges for the same `tenancyId + purpose + userId`.
- When `invalidateExisting` is `true` and `userId` is absent:
  Invalidate all unverified, unexpired challenges for the same `tenancyId + purpose + email`.
- Invalidation and creation must happen atomically, so an old challenge cannot remain valid if the new one is returned.

#### Rationale

Today the SvelteKit example achieves this behavior by deleting its local challenge row before inserting a new one. Once local persistence is removed, Passlock must own that invalidation behavior to preserve the same security and UX guarantees.

### 2. Add a non-mutating challenge read endpoint

#### Endpoint

`POST /{tenancyId}/challenges/read`

#### Request

```json
{
  "challengeId": "ch_123",
  "token": "opaque-secret"
}
```

#### Success response

```json
{
  "_tag": "ChallengeRead",
  "challenge": {
    "id": "ch_123",
    "purpose": "login",
    "email": "alice@example.com",
    "userId": "123",
    "createdAt": 1710000000000,
    "expiresAt": 1710001800000
  }
}
```

#### Error responses

- `@error/Forbidden`
- `@error/InvalidChallenge`
- `@error/ChallengeExpired`

#### Semantics

- The endpoint must validate that the supplied `token` belongs to the supplied `challengeId`.
- The endpoint must not mutate challenge state.
- The endpoint must not increment attempt counters.
- The endpoint must not return `token` or `code`.
- The endpoint must return `@error/InvalidChallenge` for any deleted, unknown, already-consumed, or mismatched `challengeId` / `token` pair.

#### Rationale

Consumers need this to support:

- rendering the verify-code page before the user submits a code
- re-sending a code based on the canonical pending challenge
- validating that the cookie still points at a live challenge

### 3. Change challenge verification to return canonical challenge context

#### Endpoint

`POST /{tenancyId}/challenges/verify`

#### Request

Change the request body from:

```json
{
  "token": "opaque-secret",
  "code": "123456"
}
```

to:

```json
{
  "challengeId": "ch_123",
  "token": "opaque-secret",
  "code": "123456"
}
```

#### Success response

```json
{
  "_tag": "ChallengeVerified",
  "challenge": {
    "id": "ch_123",
    "purpose": "login",
    "email": "alice@example.com",
    "userId": "123",
    "createdAt": 1710000000000,
    "expiresAt": 1710001800000
  }
}
```

#### Error responses

No change to the existing error tags:

- `@error/Forbidden`
- `@error/InvalidChallenge`
- `@error/InvalidChallengeCode`
- `@error/ChallengeExpired`
- `@error/ChallengeAttemptsExceeded`

#### Semantics

- Verification must validate the `challengeId` / `token` pairing before code validation succeeds.
- On success, return the canonical challenge context used for verification.
- Keep the existing one-time-code semantics: after successful verification the challenge is considered consumed and may not be verified or read again.
- Do not return `token` or `code` in the success payload.

#### Rationale

This lets consumers complete authorization logic based on trusted server-owned `email`, `purpose`, and `userId` fields instead of a local cache.

## Public `@passlock/server` Package Changes

### New schema and types

Add a new challenge context shape that excludes secrets:

```ts
export const MailboxChallengeContext = Schema.Struct({
  id: Schema.String,
  purpose: MailboxChallengePurpose,
  email: MailboxChallengeEmail,
  userId: Schema.optional(Schema.String),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
})

export type MailboxChallengeContext = typeof MailboxChallengeContext.Type
```

### New tagged result type

```ts
export const MailboxChallengeRead = Schema.TaggedStruct("ChallengeRead", {
  challenge: MailboxChallengeContext,
})

export type MailboxChallengeRead = typeof MailboxChallengeRead.Type
```

### Change existing verify result type

Change `MailboxChallengeVerified` from an empty tagged struct to:

```ts
export const MailboxChallengeVerified = Schema.TaggedStruct("ChallengeVerified", {
  challenge: MailboxChallengeContext,
})
```

### New exported function

Add:

```ts
export interface ReadMailboxChallengeOptions extends AuthenticatedOptions {
  challengeId: string
  token: string
}

export const readMailboxChallenge: (
  options: ReadMailboxChallengeOptions
) => Promise<MailboxChallengeRead>
```

Also add the safe/effect variant and export it through:

- `packages/server/src/mailbox/mailbox.ts`
- `packages/server/src/index.ts`
- `packages/server/src/safe.ts`

### Update existing create and verify options

```ts
export interface CreateMailboxChallengeOptions extends AuthenticatedOptions {
  email: string
  purpose: string
  userId?: string | undefined
  invalidateExisting?: boolean | undefined
}

export interface VerifyMailboxChallengeOptions extends AuthenticatedOptions {
  challengeId: string
  token: string
  code: string
}
```

## Compatibility and Release Notes

- This is an additive wire-format change for successful verify responses: existing clients that only inspect `_tag` remain valid.
- This is a source-level breaking change for TypeScript consumers that call `verifyMailboxChallenge` without `challengeId`.
- `createMailboxChallenge` remains backwards-compatible because `invalidateExisting` is optional.

## Security Requirements

- Never expose `token` or `code` from read or verify responses.
- Treat `challengeId` as non-secret and `token` as the capability secret.
- Return the same `InvalidChallenge` shape for unknown, mismatched, deleted, and already-consumed challenges to avoid turning the API into an oracle.
- Do not log raw `token` or `code`.

## Tests and Acceptance Criteria

### Backend API

- Creating a challenge with `invalidateExisting: true` invalidates prior pending challenges for the matching key before the new challenge becomes usable.
- Reading with a valid `challengeId` / `token` pair returns canonical challenge context and does not mutate attempts or verification state.
- Reading with an invalid token returns `InvalidChallenge`.
- Verifying with a valid `challengeId` / `token` / `code` returns canonical challenge context.
- Verifying with a mismatched `challengeId` and `token` returns `InvalidChallenge`.
- After successful verification, the same challenge can no longer be read or verified again.

### `@passlock/server`

- New schemas decode the new API payloads.
- `readMailboxChallenge` and its safe variant narrow correctly in tests.
- `verifyMailboxChallenge` returns the enriched success payload and continues to preserve error-tag narrowing.
- README and TypeDoc examples show the new request and response shapes.

## Assumptions

- Passlock already stores enough data server-side to return canonical `purpose`, `email`, `userId`, `createdAt`, and `expiresAt`.
- Successful verification is already treated as terminal or can be made terminal without breaking intended mailbox challenge behavior.
- Signup metadata will continue to be handled outside this spec.

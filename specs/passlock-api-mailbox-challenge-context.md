# Spec: Passlock Mailbox Challenge Context and Metadata API

## Summary

This change makes Passlock the authoritative source of truth for mailbox challenge context in:

- login flows
- email-change flows
- signup flows that need to carry application-owned metadata such as `givenName` and `familyName`

After this change, an application only needs to persist:

- `challengeId`
- `token`

It should no longer need a local database copy of pending challenge fields such as:

- `email`
- `userId`
- signup metadata stored purely so it survives until verification

This does **not** move application user creation or application business rules into Passlock. It only moves pending challenge state into Passlock and `@passlock/server`.

## Goals

- Allow apps to verify mailbox challenges without locally persisting login or email-change challenge context.
- Allow apps to store opaque application metadata on a challenge and receive it back unchanged on create, read, and verify.
- Allow apps to re-read pending challenge context without mutating the challenge.
- Preserve the current "replace the previous challenge" behavior when a flow is restarted or a code is resent.
- Keep `token` and `code` out of non-create response payloads.

## Non-Goals

- Creating or mutating application user records in Passlock.
- Adding server-side query, filtering, or indexing behavior over metadata.
- Adding challenge listing or bulk-admin endpoints.
- Changing passkey or non-mailbox APIs.

## Backend Contract Changes

### 1. Extend challenge creation to support invalidation and opaque metadata

#### Endpoint

`POST /{tenancyId}/challenges`

#### Request

Add two optional fields:

- `invalidateExisting: boolean`
- `metadata: object`

Example:

```json
{
  "email": "alice@example.com",
  "purpose": "signup",
  "invalidateExisting": true,
  "metadata": {
    "givenName": "Alice",
    "familyName": "Smith"
  }
}
```

#### Metadata rules

- `metadata` is optional.
- When present, it must be a JSON object at the top level.
- The serialized UTF-8 JSON payload must be at most 4096 bytes.
- Passlock stores it opaquely and returns it unchanged.
- Passlock does not inspect it for authorization, routing, matching, or query behavior.

#### Invalidation semantics

- Default: `invalidateExisting` is `false`.
- When `invalidateExisting` is `true` and `userId` is present:
  invalidate all unverified, unexpired challenges for the same `tenancyId + purpose + userId`.
- When `invalidateExisting` is `true` and `userId` is absent:
  invalidate all unverified, unexpired challenges for the same `tenancyId + purpose + email`.
- Invalidation and creation must happen atomically, so an old challenge cannot remain valid if the new one is returned.

#### Success response

Keep the current create payload shape, but include `challenge.metadata` when metadata was supplied.

Example:

```json
{
  "_tag": "ChallengeCreated",
  "challenge": {
    "id": "ch_123",
    "purpose": "signup",
    "email": "alice@example.com",
    "token": "opaque-secret",
    "code": "123456",
    "createdAt": 1710000000000,
    "expiresAt": 1710001800000,
    "metadata": {
      "givenName": "Alice",
      "familyName": "Smith"
    }
  }
}
```

#### Rationale

Today the SvelteKit example achieves challenge replacement by deleting its local challenge row before inserting a new one, and it persists signup names locally so they survive until verification. Once local persistence is removed, Passlock must own both the challenge invalidation behavior and the metadata round-trip.

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
    "purpose": "signup",
    "email": "alice@example.com",
    "createdAt": 1710000000000,
    "expiresAt": 1710001800000,
    "metadata": {
      "givenName": "Alice",
      "familyName": "Smith"
    }
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
- When metadata exists, return it unchanged.

#### Rationale

Consumers need this to support:

- rendering the verify-code page before the user submits a code
- re-sending a code based on the canonical pending challenge
- validating that the cookie still points at a live challenge
- reading signup metadata without keeping a local challenge table

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
    "purpose": "signup",
    "email": "alice@example.com",
    "createdAt": 1710000000000,
    "expiresAt": 1710001800000,
    "metadata": {
      "givenName": "Alice",
      "familyName": "Smith"
    }
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
- On success, return the canonical challenge context used for verification, including metadata when present.
- Keep the existing one-time-code semantics: after successful verification the challenge is considered consumed and may not be verified or read again.
- Do not return `token` or `code` in the success payload.

#### Rationale

This lets consumers complete authorization logic based on trusted server-owned challenge fields instead of a local cache, including signup metadata when a flow needs it.

## Public `@passlock/server` Package Changes

### New metadata type

Expose metadata as a JSON-object shape.

At the TypeScript level:

```ts
type Json =
  | null
  | string
  | number
  | boolean
  | Json[]
  | { [key: string]: Json }

export type MailboxChallengeMetadata = { [key: string]: Json }
```

At the schema level, require a JSON object and enforce the same serialized-size limit as the backend.

### Update `MailboxChallenge`

Change the existing create-time challenge shape to include optional metadata:

```ts
export const MailboxChallenge = Schema.Struct({
  id: Schema.String,
  purpose: MailboxChallengePurpose,
  email: MailboxChallengeEmail,
  userId: Schema.optional(Schema.String),
  token: Schema.String,
  code: Schema.String,
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
  metadata: Schema.optional(MailboxChallengeMetadataSchema),
})
```

### New challenge context shape

Add a challenge context shape that excludes secrets but includes metadata:

```ts
export const MailboxChallengeContext = Schema.Struct({
  id: Schema.String,
  purpose: MailboxChallengePurpose,
  email: MailboxChallengeEmail,
  userId: Schema.optional(Schema.String),
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
  metadata: Schema.optional(MailboxChallengeMetadataSchema),
})
```

### New tagged result type

```ts
export const MailboxChallengeRead = Schema.TaggedStruct("ChallengeRead", {
  challenge: MailboxChallengeContext,
})
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
  metadata?: MailboxChallengeMetadata | undefined
}

export interface VerifyMailboxChallengeOptions extends AuthenticatedOptions {
  challengeId: string
  token: string
  code: string
}
```

## Compatibility and Release Notes

- This is an additive wire-format change for successful verify responses: existing clients that only inspect `_tag` remain valid.
- This is an additive wire-format change for create responses when metadata is present.
- This is a source-level breaking change for TypeScript consumers that call `verifyMailboxChallenge` without `challengeId`.
- `createMailboxChallenge` remains backwards-compatible because `invalidateExisting` and `metadata` are optional.

## Security Requirements

- Never expose `token` or `code` from read or verify responses.
- Treat `challengeId` as non-secret and `token` as the capability secret.
- Return the same `InvalidChallenge` shape for unknown, mismatched, deleted, and already-consumed challenges to avoid turning the API into an oracle.
- Do not log raw `token` or `code`.
- Do not log raw metadata by default.
- Treat metadata as opaque application-owned payload, not as trusted authorization input for Passlock itself.

## Tests and Acceptance Criteria

### Backend API

- Creating a challenge with `invalidateExisting: true` invalidates prior pending challenges for the matching key before the new challenge becomes usable.
- Creating a challenge with metadata returns the same metadata in the create response.
- Reading with a valid `challengeId` / `token` pair returns canonical challenge context and does not mutate attempts or verification state.
- Reading with metadata returns the same metadata unchanged.
- Reading with an invalid token returns `InvalidChallenge`.
- Verifying with a valid `challengeId` / `token` / `code` returns canonical challenge context.
- Verifying with metadata returns the same metadata unchanged.
- Verifying with a mismatched `challengeId` and `token` returns `InvalidChallenge`.
- After successful verification, the same challenge can no longer be read or verified again.
- Creating a challenge with top-level non-object metadata or metadata larger than the limit fails validation.

### `@passlock/server`

- New schemas decode metadata-bearing create, read, and verify payloads.
- `readMailboxChallenge` and its safe variant narrow correctly in tests.
- `verifyMailboxChallenge` returns the enriched success payload and continues to preserve error-tag narrowing.
- `MailboxChallenge` continues to narrow correctly when metadata is absent.
- README and TypeDoc examples show create, read, and verify with metadata.

## Assumptions

- Passlock can persist opaque metadata alongside a mailbox challenge and return it unchanged.
- Passlock already stores enough data server-side to return canonical `purpose`, `email`, `userId`, `createdAt`, and `expiresAt`.
- Successful verification is already treated as terminal or can be made terminal without breaking intended mailbox challenge behavior.
- Consumers that depend on metadata semantics will validate the metadata shape they expect before using it.

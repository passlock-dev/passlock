# Server Library Spec: Mailbox Challenge Metadata Support

## Goal

Update `@passlock/server` to expose the Passlock API changes for mailbox
challenge metadata, challenge reads, enriched verify responses, and
`invalidateOthers` creation semantics.

This spec assumes the Passlock API changes in
`specs/passlock-api-mailbox-challenge-metadata.md` have already landed.

## Scope

The public `@passlock/server` surface should be updated so library users can:

- create mailbox challenges with metadata
- create mailbox challenges with `invalidateOthers`
- read a mailbox challenge by ID
- receive the verified challenge payload when verification succeeds

Both the Effect-first and Promise-based safe surfaces must be kept in sync.

## Public Type Changes

### Create Options

Extend `CreateMailboxChallengeOptions` with:

- `metadata?: Record<string, unknown>`
- `invalidateOthers?: boolean`

These fields should be optional so existing callers continue to compile.

### Challenge Types

The library should model two challenge shapes:

- `MailboxChallenge`
  - Used for create responses.
  - Includes `secret` and `code`.
  - Includes `metadata`.
- A readable challenge type for get and verify responses
  - Excludes `secret` and `code`.
  - Includes `metadata`.

Suggested naming:

- `MailboxChallenge`
- `MailboxChallengeDetails`

The exact type name can vary, but the split should be explicit in the public
surface.

### Verify Success Type

Update `MailboxChallengeVerified` so success includes the verified challenge:

- `_tag: "ChallengeVerified"`
- `challenge: MailboxChallengeDetails`

### New Read Type

Add a success type for the read endpoint, for example:

- `_tag: "Challenge"`
- `challenge: MailboxChallengeDetails`

## New Public Functions

Add `getMailboxChallenge` to both public entrypoints:

- `packages/server/src/mailbox/mailbox.ts`
- `packages/server/src/index.ts`
- `packages/server/src/safe.ts`

Suggested input:

- `tenancyId`
- `apiKey`
- `endpoint`
- `challengeId`

Suggested result:

- Effect surface: succeeds with the challenge envelope, fails with the
  appropriate mailbox challenge read errors.
- Safe surface: returns `Result<ChallengeEnvelope, ErrorEnvelope>`.

## Schema Changes

Update `packages/server/src/schemas/challenge.ts` to support:

- a reusable JSON metadata schema
- `metadata` on create responses
- a readable challenge schema without `secret` and `code`
- a verify success schema that contains the readable challenge
- a new schema for the `getChallenge` success payload

The schema updates should remain the source of truth for runtime decoding and
type generation.

## Transport Layer Changes

Update the mailbox module implementation in
`packages/server/src/mailbox/mailbox.ts`:

- Include `metadata` and `invalidateOthers` in the create request body.
- Add a new `getMailboxChallenge` request to:
  - `GET /{tenancyId}/challenges/{challengeId}`
- Update verify decoding to expect the challenge payload on success.

The library should continue to treat payload/schema mismatches as fatal decode
errors in the same way the existing mailbox module does.

## Safe Surface Changes

Update `packages/server/src/safe.ts` so the safe wrappers expose:

- `getMailboxChallenge`
- updated `verifyMailboxChallenge`

Also export any new type guards and types needed by callers.

The safe surface should preserve the existing `success` and `failure` branching
style used throughout the package.

## Unsafe Surface Changes

Update `packages/server/src/index.ts` so the unsafe wrappers expose:

- `getMailboxChallenge`
- updated `verifyMailboxChallenge`

The unsafe surface should remain aligned with the Effect surface and simply run
the underlying Effect.

## Surface and Regression Tests

Update or add tests for:

- create request encoding with `metadata`
- create request encoding with `invalidateOthers`
- create response decoding with `metadata`
- get response decoding
- verify response decoding with the returned challenge
- safe surface exports
- public surface type tests in `surface.test.ts`

## Documentation Changes

Update the package docs and JSDoc for:

- `CreateMailboxChallengeOptions`
- `verifyMailboxChallenge`
- new `getMailboxChallenge`
- any new readable challenge type

The docs should clearly state that:

- metadata is opaque application state
- readable challenge payloads exclude `secret` and `code`
- `invalidateOthers` scopes invalidation by `userId` when present, otherwise by
  `email`, within the same purpose

## Compatibility Notes

- The new create options are additive.
- `getMailboxChallenge` is additive.
- Returning `challenge` on verify success is additive for JSON consumers, but it
  changes the TypeScript success shape and therefore requires the surface and
  docs to be updated together.

## Out of Scope

- Client-library changes.
- Mailbox challenge listing APIs.
- Application-specific validation of metadata contents.

# Passlock API Spec: Mailbox Challenge Metadata and Read APIs

## Goal

Extend the Passlock mailbox challenge API so applications can attach trusted,
opaque metadata to a challenge and later read that challenge back from Passlock
without relying on application-local persistence.

This change is intended to support flows such as the SvelteKit example, where
application-specific state such as `givenName`, `familyName`, and
`challengeExpiresAt` should live on the Passlock challenge instead of in a
separate local database table.

## Scope

This spec covers the following Passlock API changes:

- Add challenge metadata to mailbox challenges.
- Add a read-only `getChallenge` endpoint.
- Change mailbox challenge verification so the success response includes the
  verified challenge, excluding the secret and code.
- Add `invalidateOthers` semantics to mailbox challenge creation.

## Data Model

### Create Request Additions

The mailbox challenge create request should support two new optional fields:

- `metadata`
  - Type: JSON object.
  - The object is application-defined and opaque to Passlock.
  - Passlock stores and returns it unchanged.
  - It must be limited to JSON-compatible values.
- `invalidateOthers`
  - Type: boolean.
  - Default: `false`.
  - When `true`, Passlock invalidates other pending challenges in the same
    scope before returning the newly created challenge.

### Challenge Resource Shape

Passlock should distinguish between:

- A created challenge, which includes `secret` and `code`.
- A readable or verified challenge, which excludes `secret` and `code`.

The readable challenge shape should include:

- `challengeId`
- `purpose`
- `email`
- `userId` when present
- `createdAt`
- `expiresAt`
- `metadata`

If `metadata` was not supplied, Passlock should return null for
consistency.

## Endpoint Changes

### POST `/{tenancyId}/challenges`

The existing create endpoint remains in place and accepts:

- `email`
- `purpose`
- `userId`
- `metadata`
- `invalidateOthers`

The success response remains a challenge creation envelope, but the returned
challenge now also includes `metadata`.

### GET `/{tenancyId}/challenges/{challengeId}`

Add a new authenticated read-only endpoint that returns the challenge resource
without `secret` and `code`.

Expected behavior:

- Returns the pending challenge when it exists and is still readable.
- Returns the stored metadata.
- Does not expose `secret`.
- Does not expose `code`.
- Returns a not-found style error when the challenge no longer exists.

This endpoint exists so application servers can recover trusted pending state
using only `challengeId`.

### POST `/{tenancyId}/challenges/verify`

The existing verify endpoint should change its success response from:

- challenge verified with no challenge payload

to:

- challenge verified with the verified challenge resource attached, excluding
  `secret` and `code`

Expected success envelope:

- `_tag: "ChallengeVerified"`
- `challenge: { ...readable challenge fields... }`

The challenge should be the same logical challenge that was verified.

## `invalidateOthers` Semantics

When `invalidateOthers` is `true`, Passlock should invalidate other pending
challenges within the same tenancy and purpose using the following subject key:

- If `userId` is present, scope by `userId`.
- Otherwise scope by `email`.

Additional rules:

- Do not invalidate across different purposes.
- Do not invalidate the newly created challenge.
- The behavior should be reliable enough that callers can treat the returned
  challenge as the only active challenge in that scope.

This is intended to replace the SvelteKit example's current local
delete-and-replace behavior.

## Application Metadata Guidance

Passlock should treat metadata as opaque application state. For example, the
SvelteKit example may store:

- Signup:
  - `givenName`
  - `familyName`
  - `challengeExpiresAt`
- Login:
  - `challengeExpiresAt`
- Email change:
  - `challengeExpiresAt`

Passlock should not interpret `challengeExpiresAt`. It is application-defined
metadata that the caller validates after a read or verify operation.

## Security and Privacy

- `secret` and `code` must never be returned from `getChallenge`.
- `secret` and `code` must never be returned from verify success responses.
- Metadata should be treated as sensitive application data and only returned to
  authenticated server callers.
- Metadata must not affect the challenge verification rules enforced by Passlock.

## Error Handling

`getChallenge` should reuse the mailbox challenge error model where practical.
At minimum it should support:

- forbidden
- challenge not found or invalid

Verify should continue to support the existing verification errors:

- forbidden
- invalid challenge
- invalid code
- challenge expired
- attempts exceeded

## Compatibility Notes

- Adding optional request fields to create is backward compatible.
- Adding `metadata` to the create response is additive.
- Changing verify success to include `challenge` is additive at the JSON level
  but still needs a coordinated server-library update.
- `getChallenge` is a new endpoint.

## Out of Scope

- Listing all pending mailbox challenges.
- Metadata query/filter capabilities.
- Server-side validation of application-specific metadata fields such as
  `challengeExpiresAt`.

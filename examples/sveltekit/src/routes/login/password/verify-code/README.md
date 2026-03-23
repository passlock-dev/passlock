# One Time Code (OTC) Verification.

We generate a secure One Time Code, which is then emailed to the user's email address/username. The One Time Code is composed of two components:

1. 6 digit code - Emailed to the user
2. Token/secret - Stored in an HTTP cookie

## What is the token?

The token is the high-entropy handle for the pending login. 

## Why is the token required?

The 6-digit code is not enough on its own.

In this implementation, the code and token serve different jobs in `oneTimeCode.ts` and `repository.ts`:

- The token identifies and authenticates the pending password-login state in the browser. It is stored in the httpOnly cookie as `challengeId.secret`, and the server validates the secret against `secretHash` in the database.

- The 6-digit code is the user-facing proof delivered by email.

The token is needed for a few reasons:

- It binds `/login/password/verify-code` to a browser that already passed the password step, without creating a full session yet. It's essentially a "pending session"'

- It tells the server which user’s active challenges should be searched, so the code is only checked inside that user context.

- It gives the flow a high-entropy secret. A 6-digit code has only 1,000,000 possibilities, so it should not be the sole key for locating or authorizing the pending login.

- It avoids exposing user identity or challenge ids in query params or trusting hidden form fields.

- It lets the resend action continue the same pending-login flow without asking for the password again.

## Why not just store the code? 

Because then the verify step would need some other way to know which pending login the code belongs to, and the only secret would be a short 6-digit value.  Without the token, an attacker could bypass the password (and passkey auth) by brute force enumerating all 6 digit code permutations. 

## Why not just store the challenge id? 

Because `id.secret` is stronger: if someone ever got read-only database access, the stored `secretHash` still would not let them mint a valid OTC cookie.

So: the code is the second factor the user types; the token is the server-controlled continuation token that keeps the half-complete login secure.
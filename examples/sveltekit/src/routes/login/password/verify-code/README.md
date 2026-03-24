# Legacy Password Route Note

The legacy `/login/password/verify-code` route now redirects to `/login/email/verify-code`.

The underlying OTP design is still the same:

1. A 6-digit code is emailed to the user
2. A high-entropy `challengeId.secret` token is stored in an `httpOnly` cookie

The code proves access to the mailbox. The cookie token binds the pending auth flow to the browser and keeps the 6-digit code from being the only secret in play.

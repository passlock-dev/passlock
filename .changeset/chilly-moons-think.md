---
"@passlock/sveltekit-example": minor
"@passlock/cli": minor
"@passlock/client": minor
"@passlock/server": minor
"@passlock/node": patch
---

Add deleteUserPasskeys helper utilities

If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

Note: `deleteUserPasskeys` is available in the `@passlock/client` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.


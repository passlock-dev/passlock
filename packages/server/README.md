<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="https://github.com/passlock-dev/passlock">
    <img src="https://passlock-assets.b-cdn.net/images/passlock-logo.svg" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div align="center">
  <picture align="center">
    <source srcset="https://passlock-assets.b-cdn.net/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="https://passlock-assets.b-cdn.net/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Server-side library to accompany the <a href="https://www.npmjs.com/package/@passlock/browser">@passlock/browser</a> package
    <br />
    <a href="https://passlock.dev"><strong>Project website »</strong></a>
    <br />
    <a href="https://github.com/passlock-dev/passlock">GitHub</a>
    ·
    <a href="https://passlock.dev">Documentation</a>
    ·
    <a href="https://passlock.dev/getting-started/">Quick start</a>
    ·
    <a href="https://passlock.dev/#demo">Demo</a>   
  </p>
</div>

<br />

## See also

For frontend usage please see the accompanying [@passlock/browser][browser] package

## Requirements

Node 20+ (If running Node)

## Usage

### Authorize a passkey registration

Create passkey registrations from your backend after you have authenticated the
user and decided they are allowed to add a passkey. The server authorizes a
short-lived `registrationToken` for the `rpId` and `rpName` your backend
supplies; send only that token to the browser and use it with `registerPasskey`
from `@passlock/browser`.

Choose `rpId` in your backend for each prepared ceremony. It is not configured
through tenancy passkey settings.

```ts
import { authorizePasskeyRegistration } from "@passlock/server"

const result = await authorizePasskeyRegistration(
  {
    rpId: "example.com",
    rpName: "Example App",
    userId: "user_123",
    username: "user@example.com",
    displayName: "User Example",
  },
  {
    apiKey: process.env.PASSLOCK_API_KEY!,
    tenancyId: "your-tenancy-id",
  }
)

if (result.success) {
  return {
    registrationToken: result.value.registrationToken,
  }
}

throw new Error(result.error.message)
```

The authorized registration token authorizes one browser registration ceremony for
the authorized user. Treat it as bearer authorization, do not log it, and discard
it after it is sent to the browser.

Please see the [Quick start guide](https://passlock.dev/getting-started/) for a complete registration
and verification flow.

[browser]: https://www.npmjs.com/package/@passlock/browser

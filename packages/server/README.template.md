<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Server-side library to accompany the <a href="https://www.npmjs.com/package/@passlock/browser">@passlock/browser</a> package
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
    ·
    <a href="#{DEMO}#">Demo</a>   
  </p>
</div>

<br />

## See also

For frontend usage please see the accompanying [@passlock/browser][browser] package

## Requirements

Node 20+ (If running Node)

## Usage

### Prepare a passkey registration

Create passkey registrations from your backend after you have authenticated the
user and decided they are allowed to add a passkey. The server prepares a
short-lived `registrationToken`; send only that token to the browser and use it
with `registerPasskey` from `@passlock/browser`.

```ts
import { preparePasskeyRegistration } from "@passlock/server"

const result = await preparePasskeyRegistration(
  {
    rpId: "example.com",
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

The prepared registration token authorizes one browser registration ceremony for
the prepared user. Treat it as bearer authorization, do not log it, and discard
it after it is sent to the browser.

Please see the [Quick start guide](#{TUTORIAL}#) for a complete registration
and verification flow.

[browser]: https://www.npmjs.com/package/@passlock/browser

<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<h1 align="center">Passkey Authentication for TypeScript apps</h1>

<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Next generation passkey authentication for Astro, SvelteKit, Angular and other frameworks.
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

## Key Features

Powerful passkey features for browser applications.

1. **🔓 No lock-in**  
Framework agnostic. Standards compliant.

2. **🔑 Domain migration**  
Use backend-authorized RP IDs with WebAuthn related-origin support.

3. **🚀 Zero config passkeys**  
Works out of the box with sensible defaults.

4. **📱 Credential management**  
Programmatically manage passkeys on end user devices

5. **💪 Powerful**  
User verification, autofill, roaming authenticators and more.

## Register a passkey

Passkey registration starts on your backend. Use
`@passlock/server` to authorize a registration for the application user, return
the resulting `registrationToken` to the browser, then pass that token to
`registerPasskey`.

```ts
import { registerPasskey } from "@passlock/browser"

const result = await registerPasskey(
  { registrationToken },
  { tenancyId: "your-tenancy-id" }
)

if (result.success) {
  // Send this code to your backend and verify it there.
  console.log(result.value.code)
}

if (result.failure) {
  console.error(result.error.message)
}
```

`registerPasskey` redeems the one-time registration token for WebAuthn
creation options, asks the authenticator to create the passkey, and verifies
the result with Passlock.

Your backend chooses the RP ID when it authorizes registration or authentication.
The browser library does not accept an RP ID directly; it uses the WebAuthn
options returned by Passlock. During domain migration, configure WebAuthn
related origins for the browser platform if the current origin needs to use
passkeys for a different RP ID.

## More information

Please see the [tutorial](#{TUTORIAL}#) and [documentation](#{DOCS}#)

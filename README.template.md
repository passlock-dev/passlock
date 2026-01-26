<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<h1 align="center">Frictionless passkey authentication in under 30 minutes</h1>

<a name="readme-top"></a>
<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Ship production-ready passkey authentication without becoming a WebAuthn expert
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
    ·
    <a href="#{DEMO}#">Demo</a>    
  </p>
</div>

<br />

## How Passlock works (in 60 seconds)

1. Passlock handles WebAuthn complexity (browser quirks, ceremonies, encoding)
2. Your frontend registers/authenticates passkeys using a simple JS API
3. Your backend exchanges short-lived codes for verified passkey identities
4. You stay in control of users, sessions, and authorization

No SDK lock-in. No backend coupling.

## Why we built Passlock

Passlock began as an internal project at a large, regulated energy company.

We needed strong second-factor authentication without the friction of TOTP apps or the privacy risks of SMS codes. WebAuthn was a perfect fit, but none of our approved enterprise identity providers supported it at the time.

So we built our own system.

Because passkeys never share private keys with the server and were used alongside existing authentication mechanisms, the approach was approved by security architects as low risk.

Passlock exists to make that same production-tested, privacy-preserving approach available to other teams.

## Who Passlock is for

- Developers implementing passkeys alongside other authentication strategies
- Teams needing to launch quickly, then adopt advanced features as the need arises
- Organizations who don't want to be locked into a product or ecosystem

Passlock is not ideal if you want a fully self-hosted setup.

## Key features
 
- **:unlock: No lock-in**  
Framework agnostic. Standards compliant.

- **:key: Related origins (domain migration)**  
Accept passkeys from other domains on your site (subject to security constraints).

- **:rocket: Zero config passkeys**  
Works out of the box with sensible defaults.

- **:iphone: Credential management**  
Programmatically manage passkeys on end user devices

- **:muscle: Powerful**  
User verification, autofill, roaming authenticators and more.

## Why teams choose Passlock over alternatives

Passlock is for teams that want to ship production-ready passkeys without backend lock-in, credential loss, or re-implementing WebAuthn edge cases.

Below is how it compares to common alternatives.

| Feature / Capability | Passlock | SimpleWebAuthn | Passport.js (WebAuthn) | Auth0 |
|----------------------|----------|----------------|-------------------------|-------|
| Passkeys / WebAuthn support | ✅ First-class | ✅ First-class | ✅ Low-level | ⚠️ Limited |
| Self hosted | ❌ | ✅ | ✅ | ❌ |
| Backend agnostic | ✅ | ⚠️ JS-Only | ❌ | ✅ |
| Related origins (domain migration) | ✅ | ❌ | ❌ | ❌ |
| Client-side passkey management | ✅ | ❌ | ❌ | ❌ |
| Credential portability | ✅ | ✅ | ✅ | ❌ |
| No vendor / framework lock-in | ✅ | ✅ | ⚠️ | ❌ |
| Management & audit tooling | ✅ | ❌ | ❌ | ✅ |

> ⚠️ **Notes**
> - **Low-level**: significant custom implementation required  
> - **Limited**: passkeys are not a core design primitive  
> - **JS-only**: Requires a JavaScript backend (Node, Deno, Bun)

The table above highlights high-level trade-offs. Details and context follow below.

### [SimpleWebAuthn][simplewebauthn]

SimpleWebAuthn is an excellent self-hosted WebAuthn library.

Passlock builds on it with additional capabilities:
	•	Backend-agnostic (Node, Python, Java, Go, etc.)
	•	Related origin requests (safe domain migration)
	•	Client-side passkey management
	•	Secure credential storage and audit logs
	•	Management and debugging tooling

We use SimpleWebAuthn internally — Passlock exists to eliminate the boilerplate teams keep rebuilding on top of it.

### [Passport.js][passportjs] (WebAuthn strategy)

Passport.js provides a low-level WebAuthn strategy intended for Express-based applications.

In practice, this means you are responsible for:
	•	Challenge storage and lifecycle management
	•	Encoding/decoding WebAuthn payloads
	•	Browser compatibility quirks
	•	Frontend integration and UX

Passlock abstracts these concerns into simple browser and server APIs, works with any framework.

### [Auth0][auth0]

Auth0 supports passkeys as part of a broader identity platform, but treats them as an add-on rather than a first-class primitive.

Key limitations:
	•	Fixed registration and authentication flows
	•	Limited access to underlying passkey data
	•	Passkeys cannot be exported

:warning: Vendor lock-in warning
If you migrate away from Auth0, existing passkeys stop working and users must re-register.

Passlock keeps passkeys portable and migration-safe, giving you full control over user identities while still abstracting WebAuthn complexity.

### Summary

Choose Passlock if you want:
* Passkeys without framework or vendor lock-in
* Safe domain migration
* Headless, production-ready flows
* Full ownership of credential data

## Quick start

You can be up and running with a working passkey flow in minutes :rocket:

Create an isolated "tenancy" (environment):

```bash
npx @passlock/cli init
```

Take a note of your `Tenancy ID` and `API Key`

### Register a passkey

Passlock uses short-lived, single-use codes to safely bridge the browser and backend. Register a passkey in your frontend JS and send the result to your backend for verification:

```typescript
// frontend/register.ts
import { registerPasskey, isRegistrationSuccess } from "@passlock/client/passkey";

// capture a username from somewhere

// call this in a button click handler or similar action
const result = await registerPasskey({ tenancyId, username });

if (isRegistrationSuccess(result)) {
  // result includes a code, submit this to your backend for verification
  myHiddenFormField.value = result.code;
  myForm.requestSubmit();
}
```

In your backend verify the code to obtain details about the newly registered passkey. We'll use the @passlock/node library for this, but it can also be done via vanilla REST.

```typescript
// backend/register.ts
import { exchangeCode, isExtendedPrincipal } from "@passlock/node";

const result = await exchangeCode(code, { tenancyId, apiKey });

// ExtendedPrincipal includes details about the new passkey
if (isExtendedPrincipal(result)) {
  // associate the authenticatorId (passkeyId) with a local user account
  linkPasskey(user.id, result.authenticatorId);
}
```

### Authenticate a passkey

Very similar to the registration process, authenticate in your frontend and send the code to your backend for verification.

```typescript
// frontend/authenticate.ts
import { authenticatePasskey, isAuthenticationSuccess } from "@passlock/client/passkey";

// call this in a button click handler or similar action
const result = await authenticatePasskey({ tenancyId });

if (isAuthenticationSuccess(result)) {
  // result includes a code, submit this to your backend for verification
  myHiddenFormField.value = result.code;
  myForm.requestSubmit();
} 
```

In your backend, verify the code and lookup the user by authenticatorId ...

```typescript
// backend/authenticate.ts
import { exchangeCode, isExtendedPrincipal } from "@passlock/node";

const result = await exchangeCode(code, { tenancyId, apiKey });

if (isExtendedPrincipal(result)) {
  lookupUserByPasskeyId(result.authenticatorId);
}
```

> [!TIP]  
> **Not using a Node backend?** The examples in this README use our `@passlock/node` server library, but **this is not required**. Passlock works similarly to Oauth2/OpenID Connect, so you can make vanilla HTTP calls or use any suitable JWT library to verify an `id_token` (JWT).

## More information

Please see the [tutorial](https://passlock.dev/getting-started/) and [documentation](https://passlock.dev)

---

If Passlock saved you time or helped you ship passkeys faster, a ⭐ on GitHub helps more than you think.

[contact]: https://passlock.dev/contact
[node]: https://www.npmjs.com/package/@passlock/node
[simplewebauthn]: https://simplewebauthn.dev
[passportjs]: https://github.com/jaredhanson/passport-webauthn
[auth0]: https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn
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

## Who Passlock is for

- Developers looking for flexible integration options
- Teams needing to launch quickly, then adopt advanced features as the need arises
- Organizations who don't want to be locked into a product, framework or ecosystem

## Key features
 
**:unlock: No lock-in**  
Framework agnostic. Standards compliant.

**:key: Related origins (domain migration)**  
Accept passkeys from other domains on your site (subject to security constraints).

**:rocket: Zero config passkeys**  
Works out of the box with sensible defaults.

**:iphone: Credential management**  
Programmatically manage passkeys on end user devices.

**:muscle: Powerful**  
User verification, autofill, roaming authenticators and more.

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
import { registerPasskey } from "@passlock/client/passkey";

const tenancyId = "myTenancyId";

// supply or capture a username
const username = "jdoe@gmail.com";

// call this in a click handler or similar action
const result = await registerPasskey({ tenancyId, username });

// send this code to your backend for verification
console.log('code: %s', result.code); 
```

In your backend verify the code to obtain details about the newly registered passkey. We'll use the [@passlock/node][passlock-node] library for this, but you can also make vanilla REST calls.

```typescript
// backend/register.ts
import { exchangeCode } from "@passlock/node";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

const result = await exchangeCode(code, { tenancyId, apiKey });

// includes details about the new passkey
// associate the authenticatorId (passkey ID) with a local user account
console.log('passkey id: %s', result.authenticatorId); 
```

### Authenticate a passkey

Very similar to the registration process, authenticate in your frontend and send the code to your backend for verification.

```typescript
// frontend/authenticate.ts
import { authenticatePasskey } from "@passlock/client/passkey";

const tenancyId = "myTenancyId";

// call this in a button click handler or similar action
const result = await authenticatePasskey({ tenancyId });

// send this code to your backend for verification
console.log('code: %s', result.code); 
```

In your backend, verify the code and lookup the user by authenticatorId ...

```typescript
// backend/authenticate.ts
import { exchangeCode } from "@passlock/node";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

const result = await exchangeCode(code, { tenancyId, apiKey });

// lookup the user based on their authenticatorId
console.log('passkey id: %s', result.authenticatorId); 
```

> [!TIP]  
> **Not using a Node backend?** The examples in this README use our [@passlock/node][passlock-node] server library, but **this is not required**. Passlock works similarly to Oauth2/OpenID Connect, so you can make vanilla HTTP calls or use any suitable JWT library to verify an `id_token` (JWT).

## More information

Please see the [tutorial](https://passlock.dev/getting-started/) and [documentation](https://passlock.dev)

---

If Passlock saved you time or helped you ship passkeys faster, a ⭐ on GitHub helps more than you think.

[contact]: https://passlock.dev/contact
[passlock-node]: https://www.npmjs.com/package/@passlock/node
[simplewebauthn]: https://simplewebauthn.dev
[passportjs]: https://github.com/jaredhanson/passport-webauthn
[auth0]: https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn
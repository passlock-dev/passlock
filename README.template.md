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

> [!TIP]
> Use our [LLM Agent Skill][agent-skill] to supercharge Codex, Claude, Copilot or your coding agent of choice :robot:

## How Passlock works (in 60 seconds)

1. Passlock handles WebAuthn complexity (browser quirks, ceremonies, encoding)
2. Your frontend registers/authenticates passkeys using a simple JS API, resulting in a code and id_token (JWT)
3. Your backend exchanges the code or verifies the JWT using our server library or REST API.
4. You stay in control of users, sessions, and authorization

No SDK lock-in. No backend coupling.

This monorepo contains the public browser SDK, server SDK, CLI, and a reference SvelteKit example.

## Who Passlock is for

- Developers looking for flexible integration options
- Teams needing to launch quickly, then adopt advanced features as the need arises
- Organizations who don't want to be locked into a product, framework or ecosystem

## Key features
 
**:unlock: No lock-in**  
Framework agnostic. Standards compliant.

**:rocket: Zero config passkeys**  
Works out of the box with sensible defaults.

**:arrow_right: Related origins**  
Migrate user passkeys to a new domain.

**:iphone: Credential management**  
Manage passkeys on end-user devices.

**:muscle: Powerful**  
User verification, autofill, roaming authenticators and more.

## Quick start

You can be up and running with a working passkey flow in minutes :rocket:

Create a new Passlock tenancy:

```bash
npx @passlock/cli init
```

Take a note of your `Tenancy ID` and `API Key`.

### Register a passkey

Passlock uses short-lived, single-use codes and signed `id_token`s to safely bridge the browser and backend. Register a passkey in your frontend JS and send either value to your backend for verification:

```typescript
// frontend/register.ts
import { registerPasskey } from "@passlock/browser";

const tenancyId = "myTenancyId";

// supply or capture a username
const username = "jdoe@gmail.com";

// call this in a click handler or similar action
const result = await registerPasskey({ tenancyId, username });

// send result.code or result.id_token to your backend for verification
console.log('code: %s', result.code); 
```

In your backend exchange the code to obtain details about the completed registration. We'll use the [@passlock/server][passlock-server] library for this, but you can also make vanilla REST calls or verify the `id_token` instead.

```typescript
// backend/register.ts
import { exchangeCode } from "@passlock/server";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

const result = await exchangeCode({ code, tenancyId, apiKey });

// includes details about the completed registration
// associate the authenticatorId (passkey ID) with a local user account
console.log('passkey id: %s', result.authenticatorId); 
```

### Authenticate a passkey

Very similar to the registration process, authenticate in your frontend and send either the returned code or `id_token` to your backend for verification.

```typescript
// frontend/authenticate.ts
import { authenticatePasskey } from "@passlock/browser";

const tenancyId = "myTenancyId";

// call this in a button click handler or similar action
const result = await authenticatePasskey({ tenancyId });

// send result.code or result.id_token to your backend for verification
console.log('code: %s', result.code); 
```

In your backend, exchange the code and look up the user by `authenticatorId` ...

```typescript
// backend/authenticate.ts
import { exchangeCode } from "@passlock/server";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

const result = await exchangeCode({ code, tenancyId, apiKey });

// lookup the user based on their authenticatorId
console.log('passkey id: %s', result.authenticatorId); 
```

> [!TIP]  
> **Not using a JS backend?** The examples in this README use our [@passlock/server][passlock-server] server library, but **this is not required**. Passlock works similarly to OAuth2/OpenID Connect, so you can make vanilla HTTP calls or use any suitable JWT library to verify an `id_token` (JWT).

## More information

Please see the [tutorial](https://passlock.dev/getting-started/) and [documentation](https://passlock.dev)

---

If Passlock saved you time or helped you ship passkeys faster, a ⭐ on GitHub helps more than you think.

[agent-skill]: https://passlock.dev/agents/agent-skill/
[contact]: https://passlock.dev/contact
[passlock-server]: https://www.npmjs.com/package/@passlock/server
[simplewebauthn]: https://simplewebauthn.dev
[passportjs]: https://github.com/jaredhanson/passport-webauthn
[auth0]: https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn

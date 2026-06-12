<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md
-->
<div align="center">
  <a href="https://github.com/passlock-dev/passlock">
    <img src="https://passlock-assets.b-cdn.net/images/passlock-logo.svg" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<h1 align="center">Frictionless passkey authentication in under 30 minutes</h1>

<a name="readme-top"></a>
<div align="center">
  <picture align="center">
    <source srcset="https://passlock-assets.b-cdn.net/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="https://passlock-assets.b-cdn.net/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Ship production-ready passkey authentication without becoming a WebAuthn expert
    <br />
    <a href="https://passlock.dev"><strong>Project website »</strong></a>
    <br />
    <a href="https://passlock.dev">Documentation</a>
    ·
    <a href="https://passlock.dev/getting-started/">Quick start</a>
    ·
    <a href="https://passlock.dev/#demo">Demo</a>    
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

Passkey registration is a three-step process:

1. **Authorize registration**: Your backend generates a registration token for the user.
2. **Browser ceremony**: The browser asks the user to register a passkey.
3. **Exchange code**: Your backend exchanges the code returned by the browser for a registered passkey.

> [!TIP]
> You only need to pass tokens (strings) between your backend and the browser, avoiding the need to handle JSON and binary data.

```typescript
// backend/registration.ts
import { Passlock } from "@passlock/server";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";
const passlock = new Passlock({ tenancyId, apiKey });

const result = await passlock.authorizePasskeyRegistration(
  {
    rpId: "example.com",
    userId: "user_123",
    username: "jdoe@gmail.com",
    displayName: "Jane Doe",
  }
);

if (result.failure) {
  // handle the error
  throw new Error(result.error.message);
}

// send only this token to your frontend
console.log("registration token: %s", result.value.registrationToken);
```

```typescript
// frontend/register.ts
import { Passlock } from "@passlock/browser";

const tenancyId = "myTenancyId";
const passlock = new Passlock({ tenancyId });

// call this in a click handler or similar action
// ask your backend for a registration token
const registrationToken = await fetchRegistrationToken();
const result = await passlock.registerPasskey({ registrationToken });

if (result.failure) {
  // handle the error
  throw new Error(result.error.message);
}

// send result.code or result.id_token to your backend for verification
console.log("code: %s", result.value.code);
```

In your backend, exchange the code to obtain details about the completed registration. We'll use the [@passlock/server][passlock-server] library for this, but you can also make vanilla REST calls or verify the `id_token` instead.

```typescript
// backend/register.ts
import { Passlock } from "@passlock/server";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";
const passlock = new Passlock({ tenancyId, apiKey });

const result = await passlock.exchangeCode({ code });

if (result.failure) {
  // handle the error
  throw new Error(result.error.message);
}

// includes details about the completed registration
// link the authenticatorId to a local user account
console.log("user id: %s", result.value.userId);
console.log("passkey id: %s", result.value.authenticatorId);
```

### Authenticate a passkey

Very similar to the registration process, except you don't need to authorise the operation in your backend first.
Kick off authentication in your frontend then send either the returned `code` or `id_token` to your backend for verification.

```typescript
// frontend/authenticate.ts
import { Passlock } from "@passlock/browser";

const tenancyId = "myTenancyId";
const passlock = new Passlock({ tenancyId });

// call this in a button click handler or similar action
const result = await passlock.authenticatePasskey({ rpId: "example.com" });

if (result.failure) {
  // handle the error
  throw new Error(result.error.message);
}

// send result.code or result.id_token to your backend for verification
console.log('code: %s', result.value.code); 
```

> [!TIP]
> You can also start the authentication process in your backend, passing an `authenticationToken` into the `authenticatePasskey` method.

In your backend, exchange the code and look up the user by `userId` or `authenticatorId` ...

```typescript
// backend/authenticate.ts
import { Passlock } from "@passlock/server";

const tenancyId = "myTenancyId";
const apiKey = "myApiKey";
const passlock = new Passlock({ tenancyId, apiKey });

const result = await passlock.exchangeCode({ code });

if (result.failure) {
  // handle the error
  throw new Error(result.error.message);
}

// lookup the user based on their userId or authenticatorId
console.log('user id: %s', result.value.userId); 
console.log('passkey id: %s', result.value.authenticatorId); 
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

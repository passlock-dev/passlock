<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md
-->
<div align="center">
  <a href="https://github.com/passlock-dev/passlock">
    <img src="https://passlock-assets.b-cdn.net/images/passlock-logo.svg" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<h1 align="center">Passkey login for Astro, SvelteKit and other frameworks</h1>

<a name="readme-top"></a>
<div align="center">
  <picture align="center">
    <source srcset="https://passlock-assets.b-cdn.net/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="https://passlock-assets.b-cdn.net/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Typescript library for next generation authentication.
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
> **Not using a Node backend?** The examples in this README use our `@passlock/node` server library, but **this is not required**. Passlock works similarly to Oauth2/OpenID Connect, so you can make vanilla HTTP calls or use any suitable JWT library to verify the `id_token`.

## Features

Passlock abstracts the complex and ever changing WebAuthn APIs into simple browser and server APIs. Sensible defaults are chosen, but can be overridden if required, giving you a powerful authentication toolkit.

1. **:muscle: Powerful** - We expose the full WebAuthn/Passkey featureset including user verification, autofil, backup/sync and more

2. **:closed_lock_with_key: Biometrics** - Passlock allows you to add biometric authentication to your webapps

2. **:ok_hand: Headless components** - Giving you 100% control over the UI

3. **:toolbox: Framework agnostic** - Passlock works with all major frontend & backend frameworks 

4. **:woman_technologist: Dev console** - Something not working? check the unified client/server dev console

5. **:desktop_computer: Management console** - Suspend or revoke access for users, passkeys and more..

6. **:male_detective: Audit trail** - View a full audit trail for each passkey and user

## Quick start

This is a really basic introduction. Please check out the [documentation](https://passlock.dev) for detailed explanations, examples and framework integration guides.

## Register a passkey

Passkey registration is a two step process. First you use this library to register a passkey on the users device, this generates a `code` and `id_token` (jwt) which you send to your backend. Your backend code then verifies the `code` or `id_token` and associates the passkey with a user.

### Register a passkey (frontend)

```typescript
import { registerPasskey, isRegistrationSuccess } from "@passlock/client/passkey";

// get this from your dev tenancy settings in the Passlock console
const tenancyId = "myTenancyId";

// capture in a form or prefill if the user is already logged in
const username = "jdoe@gmail.com";

// call this in a button click handler or similar action
const result = await registerPasskey({ tenancyId, username });

// TS type guard
if (isRegistrationSuccess(result)) {
  // send this to your backend
  console.log({ code: result.code, id_token: result.id_token });
} else {
  console.error(result.message);
}
```

### Register a passkey (backend)

Use the `@passlock/node` library to verify the new passkey:

```typescript
import { exchangeCode, isPrincipal } from "@passlock/node/principal";

// get these from your development tenancy settings
const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

// get details about the new passkey
const result = await exchangeCode(code, { tenancyId, apiKey });

// TS type guard
if (isPrincipal(result)) {
  // includes details about the new passkey
  console.log(result);
  
  // your function
  await linkPasskey(userId, result.authenticatorId);
} else {
  console.error(result.message);
}
```

## Authenticate a passkey

Passkey authentication is very similar to registration. You use the client library to authenticate a passkey in your frontend, then send the `code` and/or `id_token` to your backend. Your backend verifies the code/id_token and looks up the user based on the passkey id (authenticatorId).

### Authenticate a passkey (frontend)

```typescript
import { authenticatePasskey, isAuthenticationSuccess } from "@passlock/client/passkey";

// get this from your dev tenancy settings in the Passlock console
const tenancyId = "myTenancyId";

// call this in a button click handler or similar action
const result = await authenticatePasskey({ tenancyId });

// TS type guard
if (isAuthenticationSuccess(result)) {
  // send this to your backend
  console.log({ code: result.code, id_token: result.id_token });
} else {
  console.error(result.message);
}
```

### Authenticate a passkey (backend)

Use the `@passlock/node` library to verify authentication:

```typescript
import { exchangeCode, isPrincipal } from "@passlock/node/principal";

// get these from your development tenancy settings
const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

// get details about the new passkey
const result = await exchangeCode(code, { tenancyId, apiKey });

if (isPrincipal(result)) {
  // includes details about the new passkey
  console.log(result);
  
  // your function
  const user = await lookupUser(result.authenticatorId);
} else {
  console.error(result.message);
}
```

## More information

Please see the [tutorial](https://passlock.dev/getting-started/) and [documentation](https://passlock.dev)

[contact]: https://passlock.dev/contact
[node]: https://www.npmjs.com/package/@passlock/node
<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<h1 align="center">Passkey Authentication Framework</h1>

<a name="readme-top"></a>
<div align="center">
  <picture align="center">
    <source srcset="#{ASSETS}#/images/client-repo-banner.dark.svg" media="(prefers-color-scheme: dark)" />
    <img align="center" width=550 height=50 src="#{ASSETS}#/images/client-repo-banner.svg" />
  </picture>
  <p align="center">
    Typescript library for next generation authentication.
    <br />
    <a href="#{PASSLOCK_SITE}#"><strong>Project website »</strong></a>
    <br />
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Quick start</a>
  </p>
</div>

<br />

> [!TIP]  
> **Not using a Node backend?** The examples in this README use our `@passlock/node` server side library, but **this is not required**. Passlock works similarly to Oauth2/OpenID Connect, so you can make vanilla HTTP calls in your backend to exchange the `code` or use any suitable JWT library to verify our `id_token`.

## Features

Passkeys and the WebAuthn API are quite complex. We've tried to simplify things for you, whilst still offering you the power and flexibility of the underlying APIs.

1. **🔐 Replace passwords** - Replace passwords with the next generation authentication technology

2. **💪 Multi-factor authentication** - Use passkeys alongside other authentication mechanisms to deliver fast, frictionless 2FA

3. **☝🏻 Biometrics** - Frictionless facial or fingerprint recognition for your webapps

4. **🖥️ Management console** - Suspend or revoke access for users and passkeys and more..

5. **🕵️ Audit trail** - View a full audit trail for each passkey and user

6. **🖥️ Dev console** - Something not working? check the web console for details

7. **👌 Headless components** - You have 100% control over the UI

## Register a passkey

Passkey registration is a two step process. First you use this library to register a passkey on the users device, this generates a `code` and `id_token` (jwt) which you send to your backend. Your backend code then verifies the `code` or `id_token` and associates the passkey with a user.

### Register a passkey (frontend)

```typescript
import { registerPasskeyUnsafe } from "@passlock/client/passkey";

// get this from your dev tenancy settings in the Passlock console
const tenancyId = "myTenancyId";

// capture in a form or prefill if the user is already logged in
const username = "jdoe@gmail.com";

// call this in a button click handler or similar action
// NOTE unsafe just means the function could throw an error
const result = await registerPasskeyUnsafe({ tenancyId, username });

// send this to your backend
console.log({ code: result.code, id_token: result.id_token });
```

### Register a passkey (backend)

Use the `@passlock/node` library to verify the new passkey:

```typescript
import { exchangeCodeUnsafe } from "@passlock/node/principal";

// get these from your development tenancy settings
const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

// get details about the new passkey
// NOTE unsafe just means the function could throw an error
const result = await exchangeCodeUnsafe(code, { tenancyId, apiKey });

// includes details about the new passkey
console.log(result);

// your function
await linkPasskey(userId, result.authenticatorId);
```

## Authenticate a passkey

Passkey authentication is very similar to registration. You use the client library to authenticate a passkey in your frontend, then send the `code` and/or `id_token` to your backend. Your backend verifies the code/id_token and looks up the user based on the passkey id (authenticatorId).

### Authenticate a passkey (frontend)

```typescript
import { authenticatePasskeyUnsafe } from "@passlock/client/passkey";

// get this from your dev tenancy settings in the Passlock console
const tenancyId = "myTenancyId";

// call this in a button click handler or similar action
// NOTE unsafe just means the function could throw an error
const result = await authenticatePasskeyUnsafe({ tenancyId });

// send this to your backend
console.log({ code: result.code, id_token: result.id_token });
```

### Authenticate a passkey (backend)

Use the `@passlock/node` library to verify authentication:

```typescript
import { exchangeCodeUnsafe } from "@passlock/node/principal";

// get these from your development tenancy settings
const tenancyId = "myTenancyId";
const apiKey = "myApiKey";

// get details about the new passkey
// NOTE unsafe just means the function could throw an error
const result = await exchangeCodeUnsafe(code, { tenancyId, apiKey });

// includes details about the new passkey
console.log(result);

// your function
const user = await lookupUser(result.authenticatorId);
```

## More information

Please see the [tutorial](#{TUTORIAL}#) and [documentation](#{DOCS}#)

[contact]: https://passlock.dev/contact
[node]: https://www.npmjs.com/package/@passlock/node
<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="https://github.com/passlock-dev/passlock">
    <img src="https://passlock-assets.b-cdn.net/images/passlock-logo.svg" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div>
  <h1 align="center">SvelteKit Starter App</h1>
  <p align="center">
    Sveltekit starter template featuring Passkeys, Social Login (Apple & Google), CRUD operations and more...
    <br />
    <a href="https://github.com/passlock-dev/passlock/tree/master/packages/create-sveltekit/docs"><strong>Project website »</strong></a>
    <br />
    <a href="https://github.com/passlock-dev/passlock">GitHub</a>
    ·
    <a href="https://d1rl0ue18b0151.cloudfront.net">Demo</a>
    ·
    <a href="https://docs.passlock.dev">Documentation</a>
    ·
    <a href="https://docs.passlock.dev/docs/tutorial/introduction">Tutorial</a>
  </p>
</div>

<br />

## Features

1. 🔑 Passkey registration and authentication
2. 📱 [Apple sign in][apple-sign-in]
3. ☝️ [Google sign in][google-sign-in] / one-tap
4. 📪 Mailbox verification (via a one time code or link)
5. 💾 CRUD operations via [Prisma][prisma]
6. 🌘 Dark mode with theme selection (light/dark/system)
7. 🚀 [Daisy UI][daisy], [Preline UI][preline] & [Shadcn/UI][shadcn] variants

## Requirements

* Node 18+
* [pnpm][pnpm] (optional)
* This example project uses the cloud based [Passlock][passlock] framework for passkey 
registration and authentication. **Passlock is free for personal and commercial use**.
Create an account at [https://passlock.dev][passlock-signup]

## Usage

Use the CLI to create a SvelteKit app. Choose from [Daisy][daisy], [Preline][preline] or [Shadcn][shadcn] variants

```bash
pnpm create @passlock/sveltekit
```

### Set the environment variables

You'll need to set three variables:

1. PUBLIC_PASSLOCK_TENANCY_ID
2. PUBLIC_PASSLOCK_CLIENT_ID
3. PASSLOCK_API_KEY

Your Passlock **Tenancy ID**, **Client ID** and **API Key** (token) can be found in your 
[Passlock console][passlock-console] under [settings][passlock-settings]. 

Update the `.env` file with the relevant credentials.

### Start the dev server

```bash
pnpm run dev
```

## More information

Please see the template [homepage][homepage]

[passlock]: https://passlock.dev
[passlock-signup]: https://console.passlock.dev/register
[passlock-console]: https://console.passlock.dev
[passlock-settings]: https://console.passlock.dev/settings
[passlock-apikeys]: https://console.passlock.dev/apikeys
[pnpm]: https://pnpm.io/installation
[apple-sign-in]: https://developer.apple.com/sign-in-with-apple/
[google-sign-in]: https://developers.google.com/identity/gsi/web/guides/overview
[prisma]: https://www.prisma.io/orm
[daisy]: https://daisyui.com
[preline]: https://preline.co
[shadcn]: https://www.shadcn-svelte.com
[homepage]: https://github.com/passlock-dev/passlock/tree/master/packages/create-sveltekit/docs
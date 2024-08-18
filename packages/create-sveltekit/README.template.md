<!-- 
The pnpm script build:readme replaces tokens 
in README.template.md and outputs to README.md 
-->
<div align="center">
  <a href="#{GITHUB_REPO}#">
    <img src="#{PASSLOCK_LOGO}#" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<div>
  <h1 align="center">SvelteKit authentication starter app</h1>
  <p align="center">
    Sveltekit starter template featuring Passkeys, Social Login (Apple & Google) and more...
    <br />
    <a href="#{GITHUB_REPO}#/blob/master/packages/create-sveltekit/docs/README.md"><strong>Project website »</strong></a>
    <br />
    <a href="#{GITHUB_REPO}#">GitHub</a>
    ·
    <a href="#{DEMO_SITE}#">Demo</a>
    ·
    <a href="#{DOCS}#">Documentation</a>
    ·
    <a href="#{TUTORIAL}#">Tutorial</a>
  </p>
</div>

<br />

## Features

🔑 Passkey registration and authentication  
📱 Apple sign in  
☝️ Google sign in / one-tap  
📪 Mailbox verification (via a one time code or link)  
🌘 Dark mode with theme selection (light/dark/system)  
🚀 [Preline][preline] and [Shadcn][shadcn] variants

## Requirements

* Node 18+
* [pnpm][pnpm] (optional)
* This example project uses the cloud based [Passlock][passlock] framework for passkey 
registration and authentication. **Passlock is free for personal and commercial use**.
Create an account at [https://passlock.dev][passlock-signup]

## Usage

Use this CLI to create a SvelteKit app. Choose from [Preline CSS][preline] or [Shadcn/ui][shadcn] variants

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
[preline]: https://preline.co
[shadcn]: https://www.shadcn-svelte.com
[homepage]: https://github.com/passlock-dev/ts-clients/packages/create-sveltekit/docs/README.md
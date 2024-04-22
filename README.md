<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://github.com/passlock-dev/passkeys-frontend">
    <img src="https://github.com/passlock-dev/passkeys-frontend/assets/208345/53ee00d3-8e6c-49ea-b43c-3f901450c73b" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<a name="readme-top"></a>
<h1 align="center">SvelteKit Passkeys</h1>
  <p align="center">
    Starter project illustrating Passkey authentication, Google sign in/one-tap and mailbox verification.
    <br />
    <a href="https://passlock.dev/#demo">View Demo</a>
  </p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build passing" />
  <img src="https://img.shields.io/badge/coverage-98%25-blue" alt="98% test coverage" />
</div>

# Features

1. Passkey registration and authentication
2. Google sign in / Google one-tap
3. Mailbox verification

# Frameworks used

1. [Passlock][passlock] - Serverless passkey platform. Passlock handles Passkey registration and authentication, mailbox verification, user management, logging, auditing and more.
2. [Lucia][lucia] - Robust session management. Lucia is framework agnostic and works well with SvelteKit. Lucia works with many databases, we use Sqlite for this example.
3. [Tailwind] - Utility-first CSS framework 
4. [Preline] - Tailwind UI library <sup>*</sup>

<span>*</span> Uses native Svelte in place of Preline JavaScript

# Screenshots

![Passlock user profile](https://github.com/passlock-dev/passkeys/assets/208345/a4a5c4b8-86cb-4076-bd26-7c29ed2151c6)
<p align="center">Viewing a user's authentication activity on their profile page</p>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Getting started

## Prerequisites

Passlock is free. Create an account on [passlock.dev][passlock-signup]

## Clone this repo

TODO

## Install the depedencies

```
cd sveltekit-passkeys
npm install
```

## Set the environment variables

At a minimum you'll need to set three variables:

1. PUBLIC_PASSLOCK_TENANCY_ID
2. PUBLIC_PASSLOCK_CLIENT_ID
3. PASSLOCK_API_KEY

These can be found in your [Passlock console][passlock-console] under [settings][passlock-settings] and [API Keys][passlock-apikeys]. Create a `.env.local` file containing the relevant credentials.

Alternatively you can download a ready made .env file from your passlock console [settings][passlock-settings]:  
Tenancy information -> Vite .env -> Download

## Run the app

`npm run dev`

Note: by default this app runs on port 5174 when in dev mode

## Create an account and passkey

Navigate to the sign up page and complete the form. Assuming your browser supports passkeys (most do), you should be prompted to create a passkey.

## Sign in

Logout then navigate to the login page. You should be prompted to authenticate using your newly created passkey.

**Note:** Providing an email address during authentication is optional but **highly recommended**. Please see [src/routes/login/+page.svelte](src/routes/login/+page.svelte) to understand why.

# Sign in with Google

This app also allows users to register/sign using a Google account. It uses the current [sign in with google][google-signin] code, avoiding redirects.

## Adding Google sign in

1. Obtain your [Google API Client ID][google-client-id]
2. Update your `.env` or `.env.local` to include a `PUBLIC_GOOGLE_CLIENT_ID` variable.
3. Record your Google Client ID in your [Passlock settings][passlock-settings]: Social Login -> Google Client ID

Note: The last step is important!

## Testing Google sign in

If all went well you should be able to register an account and then sign in using your Google credentials.

**IMPORTANT!** If you previously registered a passkey using the same email address that you wish to use for Google, you'll need to first delete the user in your Passlock console. This starter project doesn't support account linking although we may update it in the future to illustrate this.

# Mailbox verification

This starter project also supports mailbox verification emails (via Passlock). Take a look at [src/routes/register/+page.svelte](src/routes/register/+page.svelte):

```typescript
// Email a verification link
const verifyEmailLink: VerifyEmail = {
  method: 'link',
  redirectUrl: String(new URL('/verify-email', $page.url))
}

// Email a verification code
const verifyEmailCode: VerifyEmail = {
  method: 'code',
}

// If you want to verify the user's email during registration
// choose one of the options above and take a look at /verify/email/+page.svelte
let verifyEmail: VerifyEmail | undefined = verifyEmailCode
```

## Customizing the verification emails

See the emails section of your [Passlock console][passlock-settings]

[passlock]: https://passlock.dev
[lucia]: https://lucia-auth.com
[tailwind]: https://tailwindcss.com
[preline]: https://preline.co
[passlock-signup]: https://console.passlock.dev/register
[passlock-console]: https://console.passlock.dev
[passlock-settings]: https://console.passlock.dev/settings
[passlock-apikeys]: https://console.passlock.dev/apikeys
[google-signin]: https://developers.google.com/identity/gsi/web/guides/overview
[google-client-id]: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#get_your_google_api_client_id
<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://github.com/passlock-dev/passkeys-frontend">
    <img src="https://github.com/passlock-dev/passkeys-frontend/assets/208345/53ee00d3-8e6c-49ea-b43c-3f901450c73b" alt="Passlock logo" width="80" height="80">
  </a>
</div>

<a name="readme-top"></a>
<h1 align="center">SvelteKit Passkey Starter</h1>
  <p align="center">
    Starter project illustrating Passkey authentication, Google sign in and mailbox verification.
    <br />
    <!-- <a href="https://passlock.dev/#demo">View Demo</a> -->
  </p>
</div>

<div align="center">
  <img align="center" height=50 src="static/repo-banner.svg" />
</div>

![Register a passkey](https://github.com/passlock-dev/svelte-passkeys/assets/208345/9c8a1a66-5f15-4dfd-888d-00f36bdad18a)
<p align="center">Registering a new account and passkey</p>

# Features

1. Passkey registration and authentication
2. Google sign in / Google one-tap
3. Mailbox verification
4. Dark mode with theme selection (light/dark/system)

# Frameworks used

1. [Passlock][passlock] - Serverless passkey platform. Passlock handles Passkey registration and authentication, mailbox verification, user management, logging, auditing and more.
2. [Lucia][lucia] - Robust session management. Lucia is framework agnostic and works well with SvelteKit. Lucia works with many databases, we use Sqlite for this example.
3. [Tailwind] - Utility-first CSS framework 
4. [Preline] - Tailwind UI library <sup>*</sup>

<span>*</span> Uses native Svelte in place of Preline JavaScript

# Getting started

## Prerequisites

Passlock is free. Create an account on [passlock.dev][passlock-signup]

## Clone this repo

`git clone git@github.com:passlock-dev/svelte-passkeys.git`

## Install the dependencies

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

Alternatively you can download a ready made .env file from your passlock console [settings][passlock-settings]: Tenancy information -> Vite .env -> Download

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Usage

## Run the app

`npm run dev`

**Note:** by default this app runs on port 5174 when in dev mode (see vite.config.ts)

## Create an account and passkey

Navigate to the [sign up](http://localhost:5174/register) page and complete the form. Assuming your browser supports passkeys (most do), you should be prompted to create a passkey.

## Sign in

Logout then navigate to the [login](http://localhost:5174/login) page. You should be prompted to authenticate using your newly created passkey.

**Note:** Providing an email address during authentication is optional but **highly recommended**. Please see [src/routes/login/+page.svelte](src/routes/login/+page.svelte) to understand why.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Sign in with Google

This app also allows users to register/sign using a Google account. It uses the current [sign in with google][google-signin] code, avoiding redirects.

## Adding Google sign in

1. Obtain your [Google API Client ID][google-client-id]
2. Update your `.env` or `.env.local` to include a `PUBLIC_GOOGLE_CLIENT_ID` variable.
3. Record your Google Client ID in your [Passlock settings][passlock-settings]: Social Login -> Google Client ID

**IMPORTANT!** Don't forget the last step!

## Testing Google sign in

If all went well you should be able to register an account and then sign in using your Google credentials.

**IMPORTANT!** If you previously registered a passkey using the same email address that you wish to use for Google, you'll need to first delete the user in your Passlock console. This starter project doesn't support account linking although we may update it in the future to illustrate this.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Mailbox verification

This starter project also supports mailbox verification emails (via Passlock): 

![Verifying mailbox ownership](https://github.com/passlock-dev/svelte-passkeys/assets/208345/2f7c06d6-c2a9-40f2-a8db-0a44fa378281)

Take a look at [src/routes/register/+page.svelte](src/routes/register/+page.svelte):

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

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Understand the code

The code is well documented. If something is not clear or you run into problems please file an issue and I'll update the docs accordingly.

## Passkey registration

See [src/routes/register/+page.svelte](src/routes/register/+page.svelte). The basic approach is to use sveltekit's progressive enhancements:

1. We intercept the form submission
2. We ask the Passlock library to create a passkey
3. This call returns a token, representing the new passkey
4. Attach this token to the form and submit it
5. In the backend action we verify the token by exchanging it for a Principal
6. This principal includes a user id
7. We create a new local user and link the user id

## Passkey authentication

See [src/routes/login/+page.svelte](src/routes/login/+page.svelte). Very similar to the registration:

1. We intercept the form submission
2. We ask the Passlock library to authenticate using a passkey
3. This call returns a token, representing the passkey authentication
4. Attach this token to the form and submit it
5. In the backend action we verify the token by exchanging it for a Principal
6. This principal includes a user id
7. Lookup the local user by user id and create a new Lucia session

## Google

Again it's very similar. 

1. We ask Google to authenticate the user
2. We ask the Passlock library to process Google's response
3. This call returns a token, representing the user
4. As above

<p align="right">(<a href="#readme-top">back to top</a>)</p>

# Questions? Problems

Please file an issue and I'll respond ASAP.

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

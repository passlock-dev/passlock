# Developer documentation

If something is not clear or you run into problems please file an [issue][issues] and I'll update the docs accordingly.

# The frameworks

A quick overview of the frameworks and how they are used.

## Passlock

[Passlock][passlock] handles passkey registration and authentication.

Passlock also handles social sign in, abstracting passkey and google authentication users into a common _"Principal"_. The abstraction allows this app to use the same code to handle both passkey and social authentication.

During registration and authentication, Passlock returns a token. We send this token to the backend actions and verify it's authenticity via the Passlock REST API.

## Prisma

[Primsa][prisma] is a SQL ORM that works well with both Typescript and Prisma. Lucia (see below) has built in support for Prisma.

## Lucia

[Lucia][lucia] handles sessions. Put simply, when a user authenticates, Passlock returns a token. A backend `+page.server.ts` action verifies the token is authentic, then creates a Lucia session. Lucia supports many database backends, this example uses sqlite.

## Superforms

[Superforms][superforms] makes it really easy to handle forms. We use Superforms for both the registration and authentication forms. Passkey registration & authentication hooks into Superforms events (see below).

## Melt UI

[Melt UI][meltui] is a headless component builder library for Svelte. It allows us to build accessible, interactive elements.

## Preline & Melt UI

[Preline][preline] is an awesome Tailwind UI library. Unfortunately whilst the Preline JavaScript can be used with Svelte, it's a bit clunky and doesn't play too well with Svelte.

However, Melt UI and Preline CSS classes are an awesome combination. We use **Preline for styling and Melt UI for behavior**.

## Shadcn-svelte

Shadcn/ui is a collection of tailwind components. [Shadcn-svelte][shadcn-svelte] is a excellent Svelte port, built on top of [bits-ui][bitsui] (which is itself built on Melt UI).

So you have a choice in styling between Shadcn/ui or Preline. Ultimately the behavior is handled by Melt UI.

> [!NOTE]  
> Unlike [shadcn-svelte][shadcn-svelte], I haven't ported the entire Preline framework across to Svelte. I've simply used Melt UI to build the components required by this app. However as you will see, it's really easy to build a component using Melt (or [bits-ui][bitsui])

# The code

The code is quite well commented so please check it out. I'll give a quite overview of the operations, with pointers to the relevant source code.

## Passkey registration

See [src/routes/(other)/+page.svelte](<../src/routes/(other)/+page.svelte>). The basic approach is to use Superforms events:

1. User completes and submits a form.
2. Superforms intercepts the submission
3. We ask the Passlock library to create a passkey
4. This returns a token, representing the new passkey
5. We attach this token to the form and submit it
6. In the [src/routes/(other)/+page.server.ts](<../src/routes/(other)/+page.server.ts>) action we verify the token by exchanging it for a Principal
7. This principal includes a user id
8. We create a new local user and link the user id

## Passkey authentication

See [src/routes/(other)/login/+page.svelte](<../src/routes/(other)/login/+page.svelte>). Very similar to the registration:

1. User completes and submits a form.
2. Superforms intercepts the submission
3. We ask the Passlock library to authenticate using a passkey
4. This returns a token, representing the passkey authentication
5. Attach this token to the form and submit it
6. In the [src/routes/(other)/login/+page.server.ts](<../src/routes/(other)/login/+page.server.ts>) action we verify the token by exchanging it for a Principal
7. This principal includes a user id
8. Lookup the local user by id and create a new Lucia session

## Social sign in

Similar conceptually, the heaby lifting is offloaded to Passlock. We just need to deal with the token (and some UX stuff)

1. User clicks the Apple/Google button (or one tap)
2. Apple/Google authenticates the user
3. We ask the Passlock library to process their response
4. This call returns a token, representing the user
5. As for passkey registration/authentication

## Hooks

We want to protect the `/todos` route. We do this in [src/hooks.server.ts](../src/hooks.server.ts) by checking the route id and user/session status.

## Mailbox verification

During the `registerPasskey()` call you can pass a `verifyEmail` option:

```typescript
// email a code
const verifyEmail = {
  method: 'code'
}

// email a link
const verifyEmail = {
  method: 'link',
  redirectUrl: 'http://localhost:5174/verify-email/link'
}

// verifyEmail can also be undefined in which case
// no verification mails will be sent
passlock.registerPasskey({ verifyEmail })
```

Passlock will generate a secure code or link and email it to the user during the passkey registration. The [src/routes/(other)/+page.server.ts](<../src/routes/(other)/+page.server.ts>) action then redirects the user to one of two pages:

1. /verify-email/awaiting-link - Prompts the user to check their emails
2. /verify-email/code - Prompts the user to check their emails and enter the code

### Verifying via a link

If the `verifyEmail` method is `link` you must also provide a url to which the user will be sent when they click the link. You should use the route `/verify-email/link`.

Passlock will send the user to this route, appending a `?code=xxx` query parameter. In the [src/routes/(other)/verify-email/link/+page.server.ts](<src/routes/(other)/verify-email/link/+page.server.ts>) load function we grab this code and feed it into [src/routes/(other)/verify-email/link/+page.svelte](<src/routes/(other)/verify-email/link/+page.svelte>). This page presents the user with a button. When the button is clicked we call Passlock to verify the code is authentic.

> [!TIP]
> Why do it this way? Why not simply verify the code in the +page.server.ts load function? Because we may need to re-authenticate the user. For background please see the [passlock docs](https://docs.passlock.dev/docs/howto/verify-emails#re-authenticating-the-user)

[passlock]: https://passlock.dev
[prisma]: https://www.prisma.io/orm
[lucia]: https://lucia-auth.com
[tailwind]: https://tailwindcss.com
[preline]: https://preline.co
[meltui]: https://melt-ui.com
[bitsui]: https://www.bits-ui.com/docs/introduction
[shadcn-svelte]: https://www.shadcn-svelte.com
[passlock-signup]: https://console.passlock.dev/register
[passlock-console]: https://console.passlock.dev
[passlock-settings]: https://console.passlock.dev/settings
[passlock-apikeys]: https://console.passlock.dev/apikeys
[google-signin]: https://developers.google.com/identity/gsi/web/guides/overview
[google-client-id]: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#get_your_google_api_client_id
[issues]: #{GITHUB_REPO}#/issues
[superforms]: https://superforms.rocks
[apple-verification-codes]: https://www.cultofmac.com/819421/ios-17-autofill-verification-codes-safari-mail-app/

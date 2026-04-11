# Project layout and architecture

This sample app follows typical SvelteKit patterns with a few additional patterns/conventions.

## Database schema

We use Drizzle ORM + SQLite. Feel free to swap this out for any suitable library. `$lib/server/dbSchema.ts` is a good place to start if you want to understand this app.

## Tagged unions

Instead of throwing and catching errors, we use discriminated unions with a typed discriminator `_tag` i.e. instead of:

```typescript
try {
  const user = getUser()
  console.log(`welcome ${user.name}`)
} catch (e) {
  // e is "unknown" - no typechecks
}
```

we adopt 

```typescript
const user = getUser()

if (user._tag === "success") {
  console.log(`welcome ${user.name}`)
} else if (user._tag === "@error/NotFound") {
  console.log(`user with email ${result.email} not found`)
} else if (user._tag === "@error/AccountSuspended") {
  console.log('account suspended')
}
```

## Browser / Server interaction

Passkeys are made up of a browser/device component (the private key) and a server-side component (public key). Passkey operations therefore require browser/server co-ordination.

The general pattern is:

1. A `+page.svelte` template manages the UI state (messaging, loading icons etc.), delegating logic utilities in `$lib/client`
2. The client-side helper invokes functions from `@passlock/client` to manage the passkey on the user's device
3. Client-side helper talks to the backend, making fetch requests to a `+server.ts` endpoint
4. The `+server.ts` endpoint delegates logic to utilities in `$lib/server`
5. The server-side helper invokes functions from `@passlock/server` where necessary.

## Session management

We use cookie based sessions. Sessions are created in the database and the asssociated token is set in an HTTP only cookie. Sessions are validated in `+hooks.server.ts`.

## Re-authentication

For sensitive operations e.g. account email changes we require the user to have authenticated with a passkey (if they have one) within the last N minutes. We examing the `passkeyAuthenticatedAt` property on the user's session. If it's no longer valid we prompt them to re-authenticate using their passkey.
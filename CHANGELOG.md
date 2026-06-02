# Passlock changelog

## 2.5.3

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/cli`
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.5.2

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/cli`
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.5.1

### Patch Changes

- Upgrade dependencies including upgrade to PNPM v11
- Packages affected:
  - `@passlock/cli`
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.5.0

### Minor Changes

- Introduce class based variants in addition to the safe and unsafe functions
- Packages affected:
  - `@passlock/cli`
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.4.3

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

- Renamed `@passlock/client` to `@passlock/browser` to reflect its intended usage and deployment
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.4.2

### Patch Changes

- 503bf6d: Upgrade dependencies
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.4.1

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.4.0

### Minor Changes

- b60db89: Introduce one time codes, delivered via email. This feature can be used to verify mailbox ownership and is often used for signups, logins and pending account email changes. See the [blog post](https://passlock.dev/blog/mailboxchallenges/)
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.3.1

### Patch Changes

- a5a2ecb: Update npm dependencies
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.3.0

### Minor Changes

- bf8fbeb: SvelteKit example app now supports:

  1. Email based one time login codes
  2. Mailbox verification emails
  3. Step up authentication for account management

- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.2.1

### Patch Changes

- Upgrade dependencies including Vite 8
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`
  - `@passlock/sveltekit-example`

## 2.2.0

### Minor Changes

- 9490817: Add deleteUserPasskeys helper utilities

  If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/browser` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`

- 9490817: Simplify typeguards

  Developers no longer need to use a typeguard for the successful branch of a "safe" function i.e. instead of

  ```ts
  const result = doSomething()
  if (isXXX(result)) {
    ...
  }
  ```

  We can now do

  ```ts
  const result = doSomething()
  if (result.success) {
    ...
  }
  ```

  This should improve the developer experience as you don't need to know which typeguard to use.

  Note: typeguards continue to work, as does discriminating based on the `_tag` property.

- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`

## 2.1.5

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/cli`

## 2.1.4

### Patch Changes

- 503bf6d: Upgrade dependencies
- Packages affected:
  - `@passlock/cli`

## 2.1.3

### Patch Changes

- Upgrade dependencies
- Packages affected:
  - `@passlock/cli`

## 2.1.2

### Patch Changes

- a5a2ecb: Update npm dependencies
- Packages affected:
  - `@passlock/cli`

- Upgrade dependencies
- Packages affected:
  - `@passlock/node`

## 2.1.1

### Patch Changes

- Upgrade dependencies including Vite 8
- Packages affected:
  - `@passlock/cli`

- 503bf6d: Upgrade dependencies
- Packages affected:
  - `@passlock/node`

## 2.1.0

### Minor Changes

- Introduce a new @passlock/server package, to replace the @passlock/node package which is deprecated. @passlock/server is largely backend agnostic as it uses the standardized fetch protocol instead of native node libraries.
- Packages affected:
  - `@passlock/browser`
  - `@passlock/server`

- 9490817: Add deleteUserPasskeys helper utilities

  If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/browser` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

- Packages affected:
  - `@passlock/cli`

- 9490817: Simplify typeguards

  Developers no longer need to use a typeguard for the successful branch of a "safe" function i.e. instead of

  ```ts
  const result = doSomething()
  if (isXXX(result)) {
    ...
  }
  ```

  We can now do

  ```ts
  const result = doSomething()
  if (result.success) {
    ...
  }
  ```

  This should improve the developer experience as you don't need to know which typeguard to use.

  Note: typeguards continue to work, as does discriminating based on the `_tag` property.

- Packages affected:
  - `@passlock/cli`

## 2.0.9

### Patch Changes

- Upgrade dependencies including Vite 8
- Packages affected:
  - `@passlock/node`

## 2.0.8

### Patch Changes

- 9490817: Add deleteUserPasskeys helper utilities

  If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/client` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

- Packages affected:
  - `@passlock/node`

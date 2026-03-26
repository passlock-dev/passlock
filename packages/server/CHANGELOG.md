# @passlock/server

## 2.3.0
### Minor Changes

- bf8fbeb: SvelteKit example app now supports:
  
  1. Email based one time login codes
  2. Mailbox verification emails
  3. Step up authentication for account management

## 2.2.1
### Patch Changes

- Upgrade dependencies including Vite 8

## 2.2.0

### Minor Changes

- 9490817: Add deleteUserPasskeys helper utilities

  If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/client` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

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

## 2.1.0

### Minor Changes

- Introduce a new @passlock/server package, to replace the @passlock/node package which is deprecated. @passlock/server is largely backend agnostic as it uses the standardized fetch protocol instead of native node libraries.

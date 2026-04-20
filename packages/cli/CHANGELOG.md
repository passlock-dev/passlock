# @passlock/cli

## 2.1.5
### Patch Changes

- Upgrade dependencies
- Renamed @passlock/client to @passlock/browser to reflect its intended usage and deployment

## 2.1.4
### Patch Changes

- 503bf6d: Upgrade dependencies

## 2.1.3
### Patch Changes

- Upgrade dependencies

## 2.1.2
### Patch Changes

- a5a2ecb: Update npm dependencies

## 2.1.1
### Patch Changes

- Upgrade dependencies including Vite 8

## 2.1.0

### Minor Changes

- 9490817: Add deleteUserPasskeys helper utilities

  If you have assigned a `userId` to one or more passkeys you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/browser` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

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

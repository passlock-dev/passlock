# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.6.0] - 2026-06-10

### Changed

- Server side passkey registration preparation. This prevents untrusted clients from registering passkeys without proper authorization.
- Updated CHANGELOG.md format following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

### Added

- (Optional) Server side passkey authentication preparation. Allows developers to supply known passkey IDs (allowCredentials) and other authentication options directly in backend code instead of threading them through the frontend.

## [2.5.3] - 2026-06-02

### Changed

- Upgrade dependencies.

## [2.5.2] - 2026-05-21

### Changed

- Upgrade dependencies.

## [2.5.1] - 2026-05-15

### Changed

- Upgrade dependencies, including upgrading to PNPM v11.

## [2.5.0] - 2026-04-28

### Changed

- Introduce class-based variants in addition to the safe and unsafe functions.

## [2.4.3] - 2026-04-20

### Changed

- Upgrade dependencies.
- Rename `@passlock/client` to `@passlock/browser` to reflect its intended usage and deployment.

## [2.4.2] - 2026-04-16

### Changed

- Upgrade dependencies.

## [2.4.1] - 2026-04-08

### Changed

- Upgrade dependencies.

## [2.4.0] - 2026-04-07

### Added

- Introduce one-time codes, delivered via email. This feature can be used to verify mailbox ownership and is often used for signups, logins, and pending account email changes. See the [blog post](https://passlock.dev/blog/mailboxchallenges/).

## [2.3.1] - 2026-03-26

### Changed

- Update npm dependencies.

## [2.3.0] - 2026-03-26

### Added

- Add SvelteKit example app support for email-based one-time login codes, mailbox verification emails, and step-up authentication for account management.

## [2.2.1]

### Changed

- Upgrade dependencies, including Vite 8.

## [2.2.0] - 2026-03-19

### Added

- Add `deleteUserPasskeys` helper utilities.

  If you have assigned a `userId` to one or more passkeys, you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/browser` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

### Changed

- Simplify typeguards.

  Developers no longer need to use a typeguard for the successful branch of a "safe" function. Instead of:

  ```ts
  const result = doSomething()
  if (isXXX(result)) {
    ...
  }
  ```

  You can now do:

  ```ts
  const result = doSomething()
  if (result.success) {
    ...
  }
  ```

  This should improve the developer experience because you do not need to know which typeguard to use.

  Note: typeguards continue to work, as does discriminating based on the `_tag` property.

## [2.1.5]

### Changed

- Upgrade dependencies.

## [2.1.4]

### Changed

- Upgrade dependencies.

## [2.1.3]

### Changed

- Upgrade dependencies.

## [2.1.2]

### Changed

- Update npm dependencies.
- Upgrade dependencies.

## [2.1.1] - 2026-03-19

### Changed

- Upgrade dependencies, including Vite 8.
- Upgrade dependencies.

## [2.1.0] - 2026-03-07

### Added

- Introduce a new `@passlock/server` package to replace the deprecated `@passlock/node` package. `@passlock/server` is largely backend agnostic because it uses the standardized fetch protocol instead of native Node.js libraries.
- Add `deleteUserPasskeys` helper utilities.

  If you have assigned a `userId` to one or more passkeys, you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/browser` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

### Changed

- Simplify typeguards.

  Developers no longer need to use a typeguard for the successful branch of a "safe" function. Instead of:

  ```ts
  const result = doSomething()
  if (isXXX(result)) {
    ...
  }
  ```

  You can now do:

  ```ts
  const result = doSomething()
  if (result.success) {
    ...
  }
  ```

  This should improve the developer experience because you do not need to know which typeguard to use.

  Note: typeguards continue to work, as does discriminating based on the `_tag` property.

## [2.0.9]

### Changed

- Upgrade dependencies, including Vite 8.

## [2.0.8] - 2026-03-19

### Added

- Add `deleteUserPasskeys` helper utilities.

  If you have assigned a `userId` to one or more passkeys, you can now use the `deleteUserPasskeys` function to delete all passkeys associated with that `userId`. This is useful for account closure scenarios.

  Note: `deleteUserPasskeys` is available in the `@passlock/client` and `@passlock/server` packages and can be used to delete passkeys in your Passlock vault and also from local devices/browsers.

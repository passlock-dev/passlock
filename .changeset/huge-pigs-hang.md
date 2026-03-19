---
"@passlock/sveltekit-example": minor
"@passlock/cli": minor
"@passlock/client": minor
"@passlock/server": minor
---

Simplify typeguards

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

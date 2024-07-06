<script lang="ts">
  import { enhance } from '$app/forms'
  import type { SubmitFunction } from './$types'

  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import { Passlock, PasslockError } from "@passlock/sveltekit"

  const passlock = new Passlock({
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT
  })

  let givenName = ''
  let familyName = ''
  let email = ''

  const onSubmit = (async (evt) => {
    if (!givenName || !familyName || !email) return

    const result = await passlock.registerPasskey({ givenName, familyName, email })
    if (PasslockError.isError(result)) {
      console.error(result)
      evt.cancel()
    } else {
      evt.formData.set('token', result.token)
    }
  }) satisfies SubmitFunction
</script>

<form method="post" use:enhance={onSubmit}>
  Given name:
  <input bind:value={givenName} type="text" name="givenName" /> <br />

  Family name:
  <input bind:value={familyName}  type="text" name="familyName" /> <br />

  Email:
  <input bind:value={email}  type="email" name="email" /> <br />

  <button type="submit">Submit</button>
</form>


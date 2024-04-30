<script lang="ts">
  import {
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import * as Icons from '$lib/components/icons'
  import Base from './Base.svelte'

  export let operation: 'register' | 'login' = 'login'

  $: message = options.operation === 'register' ? 'Sign up with Google' : 'Sign in with Google'

  $: options = {
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT,
    operation: operation,
    oneTap: false
  }
</script>

<Base {options} let:click on:principal>
  <button type="button" on:click={click} class="btn btn-secondary w-full py-3 px-4">
    <Icons.Google class="size-4" />
    {message}
  </button>

  <div slot="error" let:error class="error mt-2">
    {error}
  </div>
</Base>

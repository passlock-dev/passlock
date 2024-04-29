<script lang="ts">
  import {
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import { Button } from '$lib/components/ui/button'

  import type { Readable } from 'svelte/store'
  import Base from './Base.svelte'
  import { Icons } from '$lib/components/icons'

  export let operation: 'register' | 'login' = 'login'
  export let delayed: Readable<boolean>

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
  <Button variant="outline" class="flex gap-2" type="submit" on:click={click} disabled={$delayed}>
    {#if $delayed}
      <Icons.spinner class="h-4 w-4 animate-spin" />
    {:else}
      <Icons.google  class="h-4 w-4" />
    {/if}
    {message}
  </Button>

  <div slot="error" let:error class="mt-2 text-sm text-center text-red-600 dark:text-red-400">
    {error}
  </div>
</Base>

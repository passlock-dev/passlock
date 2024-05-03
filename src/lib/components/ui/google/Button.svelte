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
  export let submitting = false
  export let disabled = false  

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

<Base {options} let:click let:submitting={submittingToPasslock} on:principal>
  <!-- Note: 
    submittingToPasslock = request to the passlock api (create the Google user in Passlock and obtain a token)
    submitting = request to the +page.server.ts action (create the user in this app) 
  -->
  <button type="button" on:click={click} disabled={submitting || submittingToPasslock || disabled} class="btn btn-secondary w-full py-3 px-4">
    {#if submitting || submittingToPasslock}
      <Icons.Spinner class="size-4 animate-spin" />
    {:else}
      <Icons.Google class="size-4" />
    {/if}    
    {message}
  </button>

  <div slot="error" let:error class="error mt-2">
    {error}
  </div>
</Base>

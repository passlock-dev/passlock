<!-- 
  @component
  
  Displays a `Sign in with Google` button and an (optional) one-tap prompt.

  **IMPORTANT**: You will need to enter your Google Client ID in your Passlock
  settings - https://console.passlock.dev/settings (near the bottom under 
  'Social Login')

  ## Passlock integration
  When the user signs in, this component interacts with the Passlock backend 
  to register or authenticate the user. Passlock will handle the id_token 
  verification. Following a successful sign up event you should see a new 
  user in your Passlock console. 
  
  Ultimately the component fires a custom 'principal' event, containing the 
  Passlock Principal. 

  ## Duplicate accounts warnings
  If the user tries to register or sign in with their Google account but they 
  already registered a passkey (to the same email address) they will be prompted 
  to authenticate using their passkey instead.

  ## Custom button for better UX
  The sign in with Google code renders a button. This can lead to layout shifts 
  and the style of the button may not fit in with the rest of the site. We use a
  workaround (aka hack) by which we proxy clicks from our own button to the "real"
  google button which is hidden.
-->
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
  import * as Icons from '$lib/components/icons'

  export let operation: 'register' | 'login' = 'login'
  export let delayed: Readable<boolean>
  export let disabled = false

  $: message =
    options.operation === 'register'
      ? 'Sign up with Google'
      : 'Sign in with Google'

  $: options = {
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT,
    operation: operation,
    oneTap: false
  }
</script>

<Base {options} let:click let:requestPending on:principal>
  <!-- Note: 
    requestPending = request to the passlock api.
    $delayed = request to the +page.server.ts action -->
  <Button
    variant="outline"
    class="flex gap-2"
    type="submit"
    on:click={click}
    disabled={$delayed || requestPending || disabled}>
    {#if $delayed || requestPending}
      <Icons.spinner class="h-4 w-4 animate-spin" />
    {:else}
      <Icons.google class="h-4 w-4" />
    {/if}
    {message}
  </Button>

  <div
    slot="error"
    let:error
    class="mt-2 text-sm text-center text-red-600 dark:text-red-400">
    {error}
  </div>
</Base>

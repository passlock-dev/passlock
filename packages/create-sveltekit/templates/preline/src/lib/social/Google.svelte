<!-- 
  @component
  
  Displays a `Sign in with Google` button and an (optional) one-tap prompt.

  ## Google Client ID
  **IMPORTANT**: You will need to enter your Google Client ID in your Passlock
  settings - https://console.passlock.dev/settings (near the bottom under 
  'Social Login'). Also please ensure PUBLIC_GOOGLE_CLIENT_ID is set in your .env file. 

  ## Passlock integration
  When the user signs in, this component interacts with the Passlock backend 
  to register or authenticate the user. Passlock will handle the id_token 
  verification. Following a successful sign up event you should see a new 
  user in your Passlock console. 
  
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

  import * as Icons from '$lib/icons'
  import { Google, type Context, type GoogleOptions } from '@passlock/sveltekit/components/social'

  export let context: Context = 'signin'

  // The parent component renders a spinner when it's calling out
  // to Google or Passlock. This can also be used during form submission
  // to a backend +page.server.ts by flipping the submitting flag
  export let submitting = false

  export let disabled = false

  let options: GoogleOptions
  $: options = {
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT,
    context: context,
    google: {
      clientId: PUBLIC_GOOGLE_CLIENT_ID,
      useOneTap: false
    }
  }

  $: message = options.context === 'signup' ? 'Sign up with Google' : 'Sign in with Google'
</script>

<!-- Note: let syntax is a way of passing stuff from the base component down to this one -->
<!-- We're binding the parents 'submitting' variable to our 'submittingToPasslock' one -->
<Google {options} let:click let:submitting={parentSubmitting} on:principal>
  <!-- 
    Note: 
    parentSubmitting - Base component is making a request to the Google or Passlock APIs
    submitting - The page that uses THIS component is making a request to the 
    +page.server.ts action
  -->
  <button
    type="button"
    on:click={click}
    disabled={submitting || parentSubmitting || disabled}
    class="btn btn-secondary w-full py-3 px-4">
    {#if submitting || parentSubmitting}
      <Icons.Spinner class="size-4 animate-spin-slow" />
    {:else}
      <Icons.Google class="size-4" />
    {/if}
    {message}
  </button>

  <svelte:fragment slot="error" let:error>
    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}
  </svelte:fragment>
</Google>

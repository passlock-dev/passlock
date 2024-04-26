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

  import Google from '$lib/icons/Google.svelte'
  import { Passlock, PasslockError, type Principal } from '@passlock/client'
  import { createEventDispatcher, onMount } from 'svelte'

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const dispatch = createEventDispatcher<{ principal: Principal }>()

  export let operation: 'register' | 'login' = 'login'
  export let oneTap = false
  
  $: message = operation === 'register' ? 'Sign up with Google' : 'Sign in with Google'

  let googleBtnWrapper: HTMLDivElement
  let googleBtn: HTMLButtonElement | null
  let error = ''
  let errorDetail = ''

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

  onMount(() => {
    google.accounts.id.initialize({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      ux_mode: 'popup',
      callback: async ({ credential }) => {
        const principal =
          operation === 'register'
            ? await passlock.registerOidc({
                provider: 'google',
                idToken: credential
              })
            : await passlock.authenticateOidc({
                provider: 'google',
                idToken: credential
              })

        if (PasslockError.isError(principal) && principal.detail) {
          error = principal.message
          errorDetail = principal.detail
        } else if (PasslockError.isError(principal)) {
          error = principal.message
        } else {
          dispatch('principal', principal)
        }
      }
    })

    if (oneTap) {
      google.accounts.id.prompt()
    }

    google.accounts.id.renderButton(googleBtnWrapper, {
      type: 'icon',
      width: 200
    })

    googleBtn = googleBtnWrapper.querySelector('div[role=button]')
  })

  const click = () => {
    error = ''
    errorDetail = ''
    googleBtn?.click()
  }
</script>

<div bind:this={googleBtnWrapper} class="hidden" />

<button
  type="button"
  on:click={click}
  class="
    w-full
    py-3 px-4
    inline-flex
    justify-center
    items-center
    gap-x-2
    text-sm
    font-medium
    rounded-lg
    border
    border-gray-200
    bg-white
    text-gray-800
    shadow-sm
    hover:bg-gray-50
    disabled:opacity-50
    disabled:pointer-events-none
    dark:bg-slate-900
    dark:border-gray-700
    dark:text-white
    dark:hover:bg-gray-800">
  <Google />
  {message}
</button>

{#if error}
  <div class="mt-2 text-sm text-center text-red-600 dark:text-red-400">
    {error}
  </div>
{/if}

{#if error}
  <div class="text-sm text-center text-red-600 dark:text-red-400">
    {errorDetail}
  </div>
{/if}

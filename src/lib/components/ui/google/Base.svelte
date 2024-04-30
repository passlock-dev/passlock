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
<script lang="ts" context="module">
  export type Options = {
    tenancyId: string
    clientId: string
    googleClientId: string
    operation: 'register' | 'login'
    oneTap: boolean
    endpoint?: string
  }
</script>

<script lang="ts">
  import { Passlock, PasslockError, type Principal } from '@passlock/client'
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{ principal: Principal }>()

  export let options: Options

  let googleBtnWrapper: HTMLDivElement
  let googleBtn: HTMLButtonElement | null
  let requestPending = false
  let error = ''

  const passlock = new Passlock(options)

  onMount(() => {
    google.accounts.id.initialize({
      client_id: options.googleClientId,
      ux_mode: 'popup',
      callback: async ({ credential }) => {
        requestPending = true
        const principal =
          options.operation === 'register'
            ? await passlock.registerOidc({
                provider: 'google',
                idToken: credential
              })
            : await passlock.authenticateOidc({
                provider: 'google',
                idToken: credential
              })

        if (PasslockError.isError(principal) && principal.detail) {
          requestPending = false
          error = `${principal.message}. ${principal.detail}`.trim()
        } else if (PasslockError.isError(principal)) {
          requestPending = false
          error = principal.message
        } else {
          requestPending = false
          dispatch('principal', principal)
        }
      }
    })

    if (options.oneTap) {
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
    googleBtn?.click()
  }
</script>

<div bind:this={googleBtnWrapper} class="hidden" />

<slot {click} {requestPending} />

<slot name="error" {error} />

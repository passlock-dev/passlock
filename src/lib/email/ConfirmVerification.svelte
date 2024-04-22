<!--
  The user will arrive here after clicking the link in the verification email. 
  We display a button asking them to confirm that they wish to verify their mail.

  Why is the button required?

  We need to re-authenticate the user. For the background see
  https://docs.passlock.dev/docs/howto/verify-emails#re-authenticating-the-user

  In most cases the user will have just registered an account and therefore we 
  can re-use the Passlock token (which we keep in local storage for 5 mins). 
  In this case we don't need any input from the user. 

  However if they wait longer than 5 mins or they are using a different device 
  to the one they registered on, we need to actively re-authenticate them. 
  Browser won't allow us to perform passkey authentication unless it's in 
  response to a user initiated action e.g. clicking a button.
-->
<script lang="ts">
  import CenteredPanel from "$lib/forms/CenteredPanel.svelte";
  import Heading from "$lib/forms/Heading.svelte";
  import SubHeading from "$lib/forms/SubHeading.svelte";
  import SubmitButton from "$lib/forms/SubmitButton.svelte";
  import Passkey from "$lib/icons/Passkey.svelte";
  import { PasslockError, type Passlock } from "@passlock/client";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher<{ verified: void }>()

  export let passlock: Passlock
  export let code: string

  let error: string
  let requestPending: boolean

  const verifyEmail = async () => {
    error = ''
    requestPending = true

    const response = await passlock.verifyEmailCode({ code })

    if (PasslockError.isError(response)) {
      error = response.message
    } else if (!response.user.emailVerified) {
      error = 'Email not verified'
    } else {
      dispatch('verified')
    }

    requestPending = false
  }

  onMount(async () => {
    // if the user recently registered or authenticated using
    // a passkey, we'll have a token in local storage
    const sessionToken = passlock.getSessionToken('passkey')
    
    // if we have a token we can go ahead an verify the email
    if (sessionToken) await verifyEmail()
  })

  $:disabled = requestPending
</script>

<CenteredPanel>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <Heading>Verify your email</Heading>
      <SubHeading>
        Please click below to verify your email
      </SubHeading>
    </div>

    <form method="post" on:submit|preventDefault={verifyEmail}>
      <div class="grid gap-y-4">
        <SubmitButton {disabled} {requestPending}>
          <Passkey slot="icon" />
          Verify email
        </SubmitButton>
      </div>
    </form>

    {#if error}
      <p class="text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    {/if}
  </div>
</CenteredPanel>
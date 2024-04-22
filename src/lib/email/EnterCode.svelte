<!--
  Prompt the user to enter their verification code
  Note: you can swap out the MultiFieldPIN component for a SingleFieldPIN.
-->
<script lang="ts">
  import CenteredPanel from "$lib/forms/CenteredPanel.svelte";
  import Heading from "$lib/forms/Heading.svelte";
  import SubHeading from "$lib/forms/SubHeading.svelte";
  import PIN from "$lib/forms/MultiFieldPIN.svelte";
  import SubmitButton from "$lib/forms/SubmitButton.svelte";
  import Passkey from "$lib/icons/Passkey.svelte";
  import { createEventDispatcher } from "svelte";
  import { PasslockError, type Passlock } from "@passlock/client";

  const dispatch = createEventDispatcher<{ verified: void, resendEmail: void }>()

  export let passlock: Passlock
  
  let error: string
  let code: string
  let requestPending: boolean
  
  let htmlForm: HTMLFormElement
  let allowResend = true

  const verifyEmail = async () => {
    if (!code) {
      error = "Please enter the code"
      return
    }

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

  const resend = () => {
    dispatch('resendEmail')
    allowResend = false
  }

  $:disabled = requestPending
</script>

<CenteredPanel>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <Heading>Enter your code</Heading>
      <SubHeading>
        We've emailed an authentication code to you. Please check your emails (including junk)
      </SubHeading>
    </div>

    <form bind:this={htmlForm} method="post" on:submit|preventDefault={verifyEmail}>
      <div class="grid gap-y-4">
        <PIN bind:pin={code} on:complete={() => htmlForm.requestSubmit()} />
        
        <SubmitButton {disabled} {requestPending}>
          <Passkey slot="icon" />
          Verify email
        </SubmitButton>
      </div>
    </form>

    <p class="text-center text-sm text-gray-600 dark:text-gray-400">
      {#if allowResend}
        Still waiting?
        <a href={'#'} on:click={resend} class="text-blue-600 dark:text-blue-500 decoration-2 hover:underline font-medium">
          Resend the link
        </a>
      {:else}
        Email sent
      {/if}
    </p>

    {#if error}
      <p class="text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    {/if}
  </div>
</CenteredPanel>
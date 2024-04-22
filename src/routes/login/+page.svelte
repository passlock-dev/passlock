<!--
  A login page that allows users to sign in using a passkey or Google account.

  The flow is as follows:

  1. We use a standard HTML form.

  2. When the user submits the form we intercept the request 
     and authenticate them using the Passlock client
  
  3. The Passlock client returns a token which we attach to
     the form submission

  4. The backend action grabs the token and verifies it using
     the Passlock API

  Note about emails
  -----------------
  Passkeys are 'discoverable' credentials which means the browser
  can lookup a credential locally without needing an identifier
  e.g. username/email. That's why the email input is not marked
  as required.

  However, there is a fairly major usability issue:

  1. If the user did NOT register a passkey before authenticating,
  the browser won't generate an error. Instead it will prompt them
  to use a passkey on a different device. 99% of users will get 
  confused at this point.

  By asking for an email first we can check your Passlock vault
  to see if the email is registered and has an associated account.
  If there is no account we'll prompt them to register. If there
  is an account but they used Google to register, we'll prompt them
  to sign in using the google account.
-->
<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from "$env/static/public";
  import CenteredPanel from '$lib/forms/CenteredPanel.svelte';
  import Divider from '$lib/forms/Divider.svelte';
  import FakeEmailInput from '$lib/forms/FakeInputEmail.svelte';
  import Heading from '$lib/forms/Heading.svelte';
  import EmailInput from '$lib/forms/InputEmail.svelte';
  import PoweredBy from '$lib/forms/PoweredBy.svelte';
  import SubHeading from '$lib/forms/SubHeading.svelte';
  import SubmitButton from '$lib/forms/SubmitButton.svelte';
  import GoogleButton from '$lib/google/Button.svelte';
  import Google from '$lib/icons/Google.svelte';
  import Passkey from '$lib/icons/Passkey.svelte';
  import Link from '$lib/layout/Link.svelte';
  import { getLocalEmail, saveEmailLocally } from '$lib/email/storage';
  import { ErrorCode, Passlock, PasslockError, type Principal } from "@passlock/client";
  import { onMount } from 'svelte';
  import type { SubmitFunction } from "./$types";

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  let googlePrincipal: Principal | undefined = undefined
  let passkeyPrincipal: Principal | undefined = undefined
  let requestPending = false

  let email = ''
  let error = ''

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

  /**
   * Intercept the submit request, authenticate and append the 
   * Passlock token to the form. Then submit it as usual to the backend.
   */
  const login: SubmitFunction = async ({ formData, cancel }) => {
    error = ''
    requestPending = true
    passkeyPrincipal = undefined

    if (googlePrincipal) {
      // the user used the google button or one tap so
      // append the passlock token to the form request
      formData.append('token', googlePrincipal.token)
    } else {
      // Note passlock doesn't throw so no need for try/catch blocks
      // instead we inspect the result to see if it is an error.
      const principal = await passlock.authenticatePasskey({ email })
      
      if (PasslockError.isError(principal) && principal.code === ErrorCode.NotFound) {
        requestPending = false
        // detail will tell the user how to login (passkey or google)
        error = principal.detail ? `${principal.message}. ${principal.detail}` : principal.message
        cancel()
      } else if (PasslockError.isError(principal)) {
        requestPending = false
        error = principal.message
        cancel()
      } else {
        // append the passlock token to the form request & submit
        passkeyPrincipal = principal
        formData.append('token', principal.token)
      }
    }

    // called after the form has been submitted to the backend
    // this will update the form (and therefore user)
    return async ({ result }) => {
      setTimeout(() => {
        requestPending = false
      }, 2000)

      if (passkeyPrincipal?.user.email) { 
        // save the email so the user doensn't have to re-enter it next time
        saveEmailLocally(passkeyPrincipal.user.email)
      }
      
      // handle the server side redirects
      await applyAction(result)
    }
  }

  /*
   * We don't want to force the user to re-enter their email every 
   * time they login. After all, passkeys are supposed to be frictionless.
   * 
   * So we have it to local storage during registration and authentication 
   * and pre-fill it here.
   */
  onMount(() => {
    const savedEmail = getLocalEmail()
    if (savedEmail) email = savedEmail
  })

  let htmlForm: HTMLFormElement
  $:disabled = requestPending
</script>

<CenteredPanel>
  <div class="text-center">
    <Heading>Sign in</Heading>
    <SubHeading>
      Looking to join us?
      <Link href="/register">
        Sign up here
      </Link>
    </SubHeading>
  </div>

  <div class="mt-5">
    <GoogleButton on:principal={(event) => {
      googlePrincipal = event.detail
      htmlForm.requestSubmit() 
    }} />

    <Divider />

    <form method="post" bind:this={htmlForm} use:enhance={login}>
      <div class="grid gap-y-4">
        <!-- See note above regarding emails -->
        <EmailInput bind:value={email} error={error} name="email" displayName="Email address" autocomplete="email" />
        <!-- Safari will only autofill if we have two email inputs on the screen -->
        <FakeEmailInput />

        {#if googlePrincipal}
          <SubmitButton {disabled} {requestPending}>
            <Google slot="icon" />
            Login with Google
          </SubmitButton>
        {:else}
          <SubmitButton {disabled} {requestPending}>
            <Passkey slot="icon" />
            Login with passkey
          </SubmitButton>
        {/if}            
      </div>
      
      <PoweredBy />
    </form>
  </div>
</CenteredPanel>
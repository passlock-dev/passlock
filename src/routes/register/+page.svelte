<!--
  A registration page that allows users also create a passkey. Alternatively
  they can sign up using their Google account.

  The flow is as follows:

  1. We use a standard HTML form.

  2. When the user submits the form we intercept the request 
     and register a passkey using the Passlock client
  
  3. The Passlock client returns a token which we attach to
     the form submission

  4. The backend action grabs the token and verifies it using
     the Passlock API

  Verification emails
  -----------------
  Passlock can also take care of mailbox verification. This is actually more 
  involved than it first appears as we need to re-authenticate the user after 
  they click the link in the email or enter the code. For background see this
  article:

  https://docs.passlock.dev/docs/howto/verify-emails#re-authenticating-the-user

  You can choose to send a verification link or one time code. If no verification
  is required, just set the verifyEmail option to undefined.

  Note: You can customize the verification emails in your Passlock console -
  https://console.passlock.dev/settings (emails)
-->
<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import {
      PUBLIC_PASSLOCK_CLIENT_ID,
      PUBLIC_PASSLOCK_ENDPOINT,
      PUBLIC_PASSLOCK_TENANCY_ID
  } from "$env/static/public";
  import CenteredPanel from '$lib/forms/CenteredPanel.svelte';
  import Checkbox from '$lib/forms/Checkbox.svelte';
  import Divider from '$lib/forms/Divider.svelte';
  import Heading from '$lib/forms/Heading.svelte';
  import EmailInput from '$lib/forms/InputEmail.svelte';
  import TextInput from '$lib/forms/InputText.svelte';
  import PoweredBy from '$lib/forms/PoweredBy.svelte';
  import SubHeading from '$lib/forms/SubHeading.svelte';
  import SubmitButton from '$lib/forms/SubmitButton.svelte';
  import GoogleButton from '$lib/google/Button.svelte';
  import Google from '$lib/icons/Google.svelte';
  import Passkey from '$lib/icons/Passkey.svelte';
  import Link from '$lib/layout/Link.svelte';
  import { saveEmailLocally } from '$lib/email/storage';
  import { ErrorCode, Passlock, PasslockError, type Principal, type VerifyEmail } from "@passlock/client";
  import type { SubmitFunction } from "./$types";

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  // set by the GoogleButton
  let googlePrincipal: Principal
  
  let requestPending = false
  let error: string = ''

  let email: string = ''
  let emailError = ''

  let givenName: string = ''
  let familyName: string = ''

  let form: HTMLFormElement

  // Email a verification link
  const verifyEmailLink: VerifyEmail = {
    method: 'link',
    redirectUrl: String(new URL('/verify-email', $page.url))
  }

  // Email a verification code
  const verifyEmailCode: VerifyEmail = {
    method: 'code',
  }

  // If you want to verify the user's email during registration
  // choose one of the options above and take a look at /verify/email/+page.svelte
  let verifyEmail: VerifyEmail | undefined = verifyEmailCode

  // Safe to create a Passlock instance even during SSR
  const passlock = new Passlock({ tenancyId, clientId, endpoint })

  /**
   * Intercept the submit request, register a passkey and append the 
   * Passlock token to the form. Then submit it as usual to the backend.
   * 
   * Alternatively, if the user registered with their Google account,
   * (via the GoogleButton) use that token instead
   */
  const register: SubmitFunction = async ({ formData, cancel }) => {
    error = ''
    emailError = ''
    requestPending = true

    if (googlePrincipal) {
      // append the passlock token to the form request
      formData.append('token', googlePrincipal.token)
    } else {
      const principal = await passlock.registerPasskey({ 
        email, givenName, familyName, verifyEmail
      })

      if (PasslockError.isError(principal) && principal.code === ErrorCode.Duplicate) {
        requestPending = false
        // detail will tell the user how to login (passkey or google)
        emailError = principal.detail ? `${principal.message}. ${principal.detail}` : principal.message
        cancel()
      } else if (PasslockError.isError(principal)) {
        requestPending = false
        error = principal.message
        cancel()
      } else {
        // append the passlock token to the form request
        formData.append('token', principal.token)

        if (verifyEmail) {
          formData.append('verifyEmailMethod', verifyEmail.method)
        }
      }
    } 

    // called after the form has been submitted to the backend
    return async ({ result }) => {
      setTimeout(() => {
        requestPending = false
      }, 2000)

      // save the email so the user doensn't have to re-enter it next time
      saveEmailLocally(email)

      // handle the server side redirects
      await applyAction(result)
    }
  }

  $:disabled = requestPending
</script>

<CenteredPanel>
  <div class="text-center">
    <Heading>Sign up</Heading>
    <SubHeading>
      Already have an account?
      <Link href="/login">Sign in here</Link>
    </SubHeading>
  </div>

  <div class="mt-5">
    <GoogleButton operation='register' on:principal={(event) => googlePrincipal = event.detail} /> 

    <Divider />

    <form bind:this={form} method="post" use:enhance={register}>
      <div class="grid gap-y-4">
        {#if error}
          <div class="text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        {/if}

        {#if googlePrincipal}
          <EmailInput bind:value={googlePrincipal.user.email} name="email" displayName="Email address" required disabled />
          <TextInput  bind:value={googlePrincipal.user.givenName} name="givenName" displayName="First name" required disabled />
          <TextInput  bind:value={googlePrincipal.user.familyName} name="familyName" displayName="Last name" required disabled />
        {:else}
          <EmailInput bind:value={email} error={emailError} name="username" displayName="Email address" required />
          <TextInput  bind:value={givenName} name="givenName" displayName="First name" autocomplete="given-name" required />
          <TextInput  bind:value={familyName} name="familyName" displayName="Last name" autocomplete="family-name" required />
        {/if}

        <Checkbox name="acceptTerms" required>
          <p slot="description">
            I accept the <Link>Terms and Conditions</Link>
          </p>
        </Checkbox>

        {#if googlePrincipal}
          <SubmitButton {disabled} {requestPending}>
            <Google slot="icon" />
            Create account
          </SubmitButton>
        {:else}
          <SubmitButton {disabled} {requestPending}>
            <Passkey slot="icon" />
            Create passkey
          </SubmitButton>
        {/if}
      </div>

      <PoweredBy />
    </form>
  </div>
</CenteredPanel>




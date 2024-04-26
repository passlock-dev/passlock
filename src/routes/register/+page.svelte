<script lang="ts">
  import CenteredPanel from '$lib/forms/CenteredPanel.svelte'
  import Heading from '$lib/forms/Heading.svelte'
  import SubHeading from '$lib/forms/SubHeading.svelte'
  import Link from '$lib/layout/Link.svelte'

  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import Checkbox from '$lib/forms/Checkbox.svelte'
  import Divider from '$lib/forms/Divider.svelte'
  import InputEmail from '$lib/forms/InputEmail.svelte'
  import InputText from '$lib/forms/InputText.svelte'
  import PoweredBy from '$lib/forms/PoweredBy.svelte'
  import SubmitButton from '$lib/forms/SubmitButton.svelte'
  import GoogleButton from '$lib/google/Button.svelte'
  import Passkey from '$lib/icons/Passkey.svelte'
  import Google from '$lib/icons/Google.svelte'
  import {
    SveltePasslock,
    updateForm,
    saveEmailLocally
  } from '$lib/passlock.js'
  import { registrationFormSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import { onMount } from 'svelte'
  import type { VerifyEmail } from '@passlock/client'
  import { page } from '$app/stores'

  export let data

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new SveltePasslock({ tenancyId, clientId, endpoint })
  const redirectUrl = new URL('/verify-email/link', $page.url).href
  const verifyEmail: VerifyEmail = { method: 'link', redirectUrl }

  const form = superForm(data.form, {
    validators: valibotClient(registrationFormSchema),
    delayMs: 0,

    onSubmit: async ({ formData, cancel }) => {
      // we don't yet have a token so register a passkey to obtain one
      await passlock.register({ form, formData, cancel, verifyEmail })
    },

    onResult: () => {
      if ($superformData.authType === 'passkey') {
        saveEmailLocally($superformData.email)
      }
    }
  })

  onMount(async () => {
    await passlock.preConnect()
  })

  const { enhance, delayed, form: superformData } = form
  $: readonly = $superformData.token?.length > 0 ? 'readonly' : undefined
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
    <GoogleButton operation="register" on:principal={updateForm(form)} />

    <Divider />

    <form method="POST" use:enhance>
      <div class="flex flex-col gap-4">
        <InputEmail
          {form}
          field="email"
          label="Email address"
          autocomplete="email"
          {readonly} />
        <InputText
          {form}
          field="givenName"
          label="First name"
          autocomplete="given-name"
          {readonly} />
        <InputText
          {form}
          field="familyName"
          label="Last name"
          autocomplete="family-name"
          {readonly} />

        <Checkbox {form} field="acceptTerms">
          <div slot="label">I accept the <Link>Terms and Conditions</Link></div>
        </Checkbox>

        {#if $superformData.token}
          <SubmitButton requestPending={$delayed}>
            <Google slot="icon" />
            Sign up with Google
          </SubmitButton>
        {:else}
          <SubmitButton requestPending={$delayed}>
            <Passkey slot="icon" />
            Create passkey
          </SubmitButton>
        {/if}
      </div>

      <PoweredBy />
    </form>
  </div>
</CenteredPanel>

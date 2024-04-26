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
  import Divider from '$lib/forms/Divider.svelte'
  import InputEmail from '$lib/forms/InputEmail.svelte'
  import PoweredBy from '$lib/forms/PoweredBy.svelte'
  import SubmitButton from '$lib/forms/SubmitButton.svelte'
  import GoogleButton from '$lib/google/Button.svelte'
  import Passkey from '$lib/icons/Passkey.svelte'
  import Google from '$lib/icons/Google.svelte'
  import {
    SveltePasslock,
    updateForm,
    saveEmailLocally,
    getLocalEmail
  } from '$lib/passlock.js'
  import { loginFormSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms/client'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import { onMount } from 'svelte'

  export let data

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new SveltePasslock({ tenancyId, clientId, endpoint })

  const form = superForm(data.form, {
    validators: valibotClient(loginFormSchema),
    delayMs: 0,

    onSubmit: async ({ formData, cancel }) => {
      await passlock.login({ form, formData, cancel })
    },

    onResult: () => {
      if ($formData.authType === 'passkey' && $formData.email) {
        saveEmailLocally($formData.email)
      }
    }
  })

  onMount(async () => {
    const email = getLocalEmail()
    if (email) $formData.email = email
    await passlock.preConnect()
  })

  const { enhance, delayed, form: formData } = form
  $: readonly = $formData.token?.length > 0 ? 'readonly' : undefined
</script>

<CenteredPanel>
  <div class="text-center">
    <Heading>Sign in</Heading>
    <SubHeading>
      Not yet a member?
      <Link href="/register">Sign up here</Link>
    </SubHeading>
  </div>

  <div class="mt-5">
    <GoogleButton operation="login" on:principal={updateForm(form, true)} />

    <Divider />

    <form method="POST" use:enhance>
      <div class="flex flex-col gap-4">
        <InputEmail
          {form}
          field="email"
          label="Email address"
          autocomplete="email"
          {readonly} />

        {#if $formData.token}
          <SubmitButton requestPending={$delayed}>
            <Google slot="icon" />
            Sign in with Google
          </SubmitButton>
        {:else}
          <SubmitButton requestPending={$delayed}>
            <Passkey slot="icon" />
            Sign in with Passkey
          </SubmitButton>
        {/if}
      </div>

      <PoweredBy />
    </form>
  </div>
</CenteredPanel>

<script lang="ts">
  import {
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import * as Icons from '$lib/components/icons'
  import { ThemeSelector } from '$lib/components/theme'
  import * as Forms from '$lib/components/ui/forms'
  import * as Google from '$lib/components/ui/google'
  import Logo from '$lib/components/ui/logo'
  import {
    SveltePasslock,
    getLocalEmail,
    saveEmailLocally,
    updateForm
  } from '$lib/passlock.js'
  import { loginFormSchema } from '$lib/schemas'
  import { onMount } from 'svelte'
  import { derived } from 'svelte/store'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import { superForm } from 'sveltekit-superforms/client'

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
      if ($superformData.authType === 'passkey' && $superformData.email) {
        saveEmailLocally($superformData.email)
      }
    }
  })

  onMount(async () => {
    const email = getLocalEmail()
    if (email) $superformData.email = email
    await passlock.preConnect()
  })

  const { enhance, submitting, form: superformData } = form

  const submittingPasskey = derived(
    submitting,
    $submitting => $submitting && $superformData.authType === 'passkey'
  )

  const submittingGoogle = derived(
    submitting,
    $submitting => $submitting && $superformData.authType === 'google'
  )

  $: readonlyEmail = $submittingPasskey || undefined
</script>

<div
  class="relative h-full w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector mode="dark" />
  </div>

  <Logo />

  <div class="h-full flex items-center justify-center">
    <div class="mx-auto grid w-[350px] gap-6">
      <div class="grid gap-2 text-center">
        <h1 class="text-3xl font-bold">Login</h1>
        <p class="text-balance text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      <div class="grid gap-2">
        <form method="post" use:enhance>
          <div class="grid gap-5 grid-cols-2">
            <Forms.InputEmail
              {form}
              field="email"
              label="Email address"
              autocomplete="email"
              cols={2}
              readonly={readonlyEmail} />

            <Forms.SubmitButton submitting={$submittingPasskey}>
              <Icons.Passkey class="h-4 w-4 fill-current" slot="icon" />
              Login with passkey
            </Forms.SubmitButton>
          </div>
        </form>

        {#if PUBLIC_GOOGLE_CLIENT_ID}
          <Forms.Divider />
          <Google.Button
            operation="login"
            submitting={$submittingGoogle}
            on:principal={updateForm(form, true)} />
        {/if}

        <Forms.PoweredBy />

        <div class="mt-2 text-center text-sm">
          Don&apos;t have an account?
          <a href="/" class="underline">Sign up</a>
        </div>
      </div>
    </div>
  </div>

  <div
    class="hidden bg-muted lg:block bg-cover bg-[url('/images/bg-hero.jpg')]" />
</div>

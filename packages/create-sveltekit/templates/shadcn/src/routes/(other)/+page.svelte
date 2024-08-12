<script lang="ts">
  import {
    PUBLIC_APPLE_CLIENT_ID,
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import * as Icons from '$lib/components/icons'
  import { ThemeSelector } from '$lib/components/theme'
  import * as Forms from '$lib/components/ui/forms'
  import * as Social from '$lib/components/ui/social'
  import { registrationFormSchema } from '$lib/schemas.js'
  import type { VerifyEmail } from '@passlock/sveltekit'
  import {
    Passlock,
    saveEmailLocally,
    updateForm
  } from '@passlock/sveltekit/superforms'
  import { onMount } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'

  import Logo from '$lib/components/ui/logo'
  import { login, registerAction } from '$lib/routes.js'
  import { tick } from 'svelte'
  import { derived } from 'svelte/store'

  export let data

  const passlock = new Passlock({
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT
  })

  // During the passkey registration process
  // Passlock can send a mailbox verification email.
  //
  // If you would like to send a link instead of a code
  // please change verifyEmail to:
  // const redirectUrl = new URL('/verify-email/link', $page.url).href
  // const verifyEmail: VerifyEmail = { method: 'link', redirectUrl }
  //
  // To disable mailbox verification emails set to undefined
  // see https://docs.passlock.dev/docs/howto/verify-emails
  const verifyEmail: VerifyEmail = { method: 'code' }

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

  const { enhance, submitting, form: superformData } = form

  // We must have created a passkey or grabbed the data from google
  $: readonly = $superformData.token?.length > 0 ? true : undefined

  // Unlike login, registration is a two step process:
  // First the user clicks the Sign up with Google button which fetches their
  // data and creates an account (and token) in Passlock.
  //
  // Then they acccept the terms and submit the form.
  //
  // So we want to disable the Sign in with Google button
  // once the first step is complete.
  $: disableSocialBtns =
    ($superformData.token.length > 1 && $superformData.authType === 'apple') ||
    $superformData.authType === 'google'

  const submittingGoogle = derived(
    submitting,
    $submitting => $submitting && $superformData.authType === 'google'
  )
</script>

<div
  class="relative h-full w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector />
    <a class="text-primary hover:underline" href={login}>Login</a>
  </div>

  <Logo class="text-white" />

  <div
    class="relative hidden h-full flex flex-col bg-muted p-10 text-white dark:border-r lg:flex bg-cover bg-[url('/images/bg-hero.jpg')]">
    <div class="relative z-20 mt-auto">
      <blockquote class="space-y-2">
        <p class="text-lg">
          &ldquo;This library has saved me countless hours of work and helped me
          deliver stunning designs to my clients faster than ever before. Highly
          recommended!&rdquo;
        </p>
        <footer class="text-sm">Sofia Davis</footer>
      </blockquote>
    </div>
  </div>

  <div class="h-full flex items-center justify-center py-12">
    <div
      class="px-8 mx-auto max-w-[500px] flex w-full flex-col justify-center space-y-6">
      <div class="flex flex-col space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p class="text-sm text-muted-foreground">
          Enter your email below to create your account
        </p>
      </div>

      <div class="grid gap-2">
        <form method="post" action={registerAction} use:enhance>
          <div class="grid gap-5 grid-cols-2">
            <Forms.InputText
              {form}
              field="givenName"
              label="First name"
              {readonly} />
            <Forms.InputText
              {form}
              field="familyName"
              label="Last name"
              autocomplete="family-name"
              {readonly} />
            <Forms.InputEmail
              {form}
              field="email"
              label="Email"
              cols={2}
              autocomplete="email"
              {readonly} />

            {#if $superformData.token && $superformData.authType === 'apple'}
              <Forms.SubmitButton submitting={$submitting}>
                <Icons.Apple class="size-5" slot="icon" />
                Sign up with Apple
              </Forms.SubmitButton>
            {:else if $superformData.token && $superformData.authType === 'google'}
              <Forms.SubmitButton submitting={$submitting}>
                <Icons.Google class="size-4" slot="icon" />
                Sign up with Google
              </Forms.SubmitButton>
            {:else}
              <Forms.SubmitButton submitting={$submitting}>
                <Icons.Passkey class="size-5 fill-current" slot="icon" />
                Create passkey
              </Forms.SubmitButton>
            {/if}
          </div>
        </form>

        {#if PUBLIC_APPLE_CLIENT_ID || PUBLIC_GOOGLE_CLIENT_ID}
          <Forms.Divider />
        {/if}

        <div class="grid gap-2">
          {#if PUBLIC_APPLE_CLIENT_ID}
            <Social.Apple
              context="signup"
              disabled={disableSocialBtns}
              on:principal={updateForm(form, async () => {
                await tick()
                form.submit()
              })} />
          {/if}

          {#if PUBLIC_GOOGLE_CLIENT_ID}
            <Social.Google
              context="signup"
              disabled={disableSocialBtns}
              on:principal={updateForm(form, async () => {
                await tick()
                form.submit()
              })} />
          {/if}
        </div>

        <Forms.PoweredBy />
      </div>

      <p class="px-8 text-center text-sm text-muted-foreground">
        By creating an account, you agree to our
        <a href="#" class="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>
        and
        <a href="#" class="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  </div>
</div>

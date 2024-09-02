<script lang="ts">
  import {
    PUBLIC_APPLE_CLIENT_ID,
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import * as Icons from '$lib/icons'
  import Link from '$lib/layout/Link.svelte'
  import * as Forms from '$lib/forms'
  import FormError from '$lib/forms/FormErrors.svelte'
  import * as Social from '$lib/social'
  import { login, registerAction } from '$lib/routes.js'
  import { registrationFormSchema } from '$lib/schemas.js'
  import type { VerifyEmail } from '@passlock/sveltekit'
  import { Passlock, saveEmailLocally, updateForm } from '@passlock/sveltekit/superforms'
  import { onMount } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'
  import InputText from '$lib/forms/InputText.svelte'
  import InputEmail from '$lib/forms/InputEmail.svelte'
  import SubmitButton from '$lib/forms/SubmitButton.svelte'
  import Checkbox from '$lib/forms/Checkbox.svelte'
  import Reviews from '$lib/layout/Reviews.svelte'

  export let data: PageData

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

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
      // We don't yet have a token so register a passkey to obtain one.
      // This will attempt to register a passkey and set the token field
      // on the form. If it fails for some reason the form submission will
      // be cancelled and the error will be recorded in the either the
      // form.errors.email if it's an account level error e.g. duplicate user
      // or form.message if it's a general error.
      await passlock.register({ form, formData, cancel, verifyEmail })
    },

    onResult: () => {
      // Edge case optimization, feel free to remove :)
      // The form could have been submitted with a passkey registration
      // request or a social login request. We example the authType field
      // and if we registered a passkey we store the associated email in
      // local storage. This is effectively a 'remember my username' so if
      // a user registered more than one passkey on this site the browser
      // will default to using the last one registered.
      if ($formData.authType === 'passkey') {
        saveEmailLocally($formData.email)
      }
    }
  })

  onMount(async () => {
    await passlock.preConnect()
  })

  const { enhance, submitting, form: formData, constraints: formConstraints } = form

  // We must have created a passkey or grabbed the data from google
  // so at this point we want to lock the form before submitting it
  $: readonly = $formData.token.length > 0 ? true : undefined

  // Unlike login, registration is a two step process:
  // First the user clicks the Sign up with Google button which fetches
  // their data from Google, registers an account in Passlock and returns
  // a token.
  //
  // Next they acccept the terms and submit the form.
  //
  // So we want to disable the social buttons once the first
  // step is complete and we've obtained the token
  $: disableSocialBtns = $formData.token.length > 0
</script>

<div class="hero h-full">
  <div class="hero-content flex-col lg:flex-row gap-x-12">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">Start your journey with Acme</h1>

      <p class="py-6 max-w-xl">
        Hand-picked professionals and expertly crafted components, designed for any kind of entrepreneur.
      </p>

      <div class="flex gap-3">
        <button class="btn btn-primary">Get started</button>
        <button class="btn btn-accent">Contact sales team</button>
      </div>

      <Reviews />
    </div>

    <div class="card bg-base-200 w-full lg:w-[400px] shrink-0 shadow-2xl">
      <div class="p-4 sm:p-7">
        <div class="text-center">
          <Forms.Heading>Sign up</Forms.Heading>
          <Forms.SubHeading>
            Already have an account?
            <Link href={login}>Sign in here</Link>
          </Forms.SubHeading>
        </div>

        <div class="mt-3">
          {#if PUBLIC_APPLE_CLIENT_ID || PUBLIC_GOOGLE_CLIENT_ID}
            <div class="grid gap-2">
              {#if PUBLIC_APPLE_CLIENT_ID}
                <Social.Apple context="signup" disabled={disableSocialBtns} on:principal={updateForm(form)} />
              {/if}
              {#if PUBLIC_GOOGLE_CLIENT_ID}
                <Social.Google context="signup" disabled={disableSocialBtns} on:principal={updateForm(form)} />
              {/if}
              <Forms.Divider />
            </div>
          {/if}

          <form method="post" action={registerAction} use:enhance class="flex flex-col gap-2">
            <Forms.InputText {form} field="givenName" label="First name" autocomplete="given-name" />

            <Forms.InputText {form} field="familyName" label="Last name" autocomplete="family-name" />

            <Forms.InputEmail {form} field="email" label="Email" autocomplete="email" />

            <Forms.Checkbox {form} field="acceptTerms">
              <div slot="label">I accept the terms and conditions</div>
            </Forms.Checkbox>

            <Forms.SubmitButton class="mt-3" submitting={$submitting} disabled={$submitting}>Register</Forms.SubmitButton>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

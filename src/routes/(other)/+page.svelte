<script lang="ts">
  import * as Icons from "$lib/components/icons"
  import { page } from '$app/stores'
  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import * as Forms from '$lib/components/ui/forms'
  import { GoogleButton } from '$lib/components/ui/google'
  import { ThemeSelector } from "$lib/components/theme"
  import { SveltePasslock, saveEmailLocally, updateForm } from '$lib/passlock'
  import { registrationFormSchema } from '$lib/schemas.js'
  import type { VerifyEmail } from '@passlock/client'
  import { onMount } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'

  import { Button } from "$lib/components/ui/button/index.js"
  import { derived } from "svelte/store"
  import Logo from "$lib/components/ui/logo"

  export let data

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new SveltePasslock({ tenancyId, clientId, endpoint })
  
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

  const { enhance, delayed, form: superformData } = form
  const passkeyDelayed = derived(delayed, ($delayed) => $delayed && $superformData.authType === 'passkey')
  const googleDelayed = derived(delayed, ($delayed) => $delayed && $superformData.authType === 'google')
</script>

<div class="relative h-full w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">  
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector />
    <a class="text-primary hover:underline" href="/login">Login</a>
  </div>

  <Logo class="text-white" />

  <div class="relative hidden h-full flex flex-col bg-muted p-10 text-white dark:border-r lg:flex bg-cover bg-[url('/images/bg-hero.jpg')]">
    <div class="relative z-20 mt-auto">
      <blockquote class="space-y-2">
        <p class="text-lg">
          &ldquo;This library has saved me countless hours of work and helped me deliver
          stunning designs to my clients faster than ever before. Highly
          recommended!&rdquo;
        </p>
        <footer class="text-sm">Sofia Davis</footer>
      </blockquote>
    </div>
  </div>

  <div class="flex items-center justify-center py-12">
    <div class="px-8 mx-auto max-w-[500px] flex w-full flex-col justify-center space-y-6">
      <div class="flex flex-col space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p class="text-sm text-muted-foreground">
          Enter your email below to create your account
        </p>
      </div>

      <div class="grid gap-2">
        <form method="post" use:enhance>
          <div class="grid gap-5 grid-cols-2">
            <Forms.InputText {form} field="givenName" label="First name" />
            <Forms.InputText {form} field="familyName" label="Last name" />
            <Forms.InputEmail {form} field="email" label="Email" cols={2} />
      
            <Button class="col-span-2 flex gap-2" type="submit">
              {#if $passkeyDelayed}
                <Icons.spinner class="h-4 w-4 animate-spin" />
              {:else}
                <Icons.passkey class="fill-current h-5 w-5" />
              {/if}
              Create passkey
            </Button>
          </div>
        </form>

        <Forms.Divider />
        <GoogleButton operation='register' on:principal={updateForm(form, false)} delayed={googleDelayed} />
      </div>
      
      <p class="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our
        <a href="/terms" class="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>
        and
        <a href="/privacy" class="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  </div>
</div>




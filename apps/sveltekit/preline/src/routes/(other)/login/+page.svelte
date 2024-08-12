<script lang="ts">
  import Link from '$lib/components/layout/Link.svelte'

  import {
    PUBLIC_APPLE_CLIENT_ID,
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import * as Icons from '$lib/components/icons'
  import * as Forms from '$lib/components/ui/forms'
  import * as Social from '$lib/components/ui/social'

  import { loginAction } from '$lib/routes.js'
  import { loginFormSchema } from '$lib/schemas'
  import { getLocalEmail, Passlock, saveEmailLocally, updateForm } from '@passlock/sveltekit/superforms'
  import { onMount } from 'svelte'
  import { derived } from 'svelte/store'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  export let data: PageData

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

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

  // passlock has verified the passkey, now we're submitting the principal to +page.server.ts
  const submittingPasskey = derived(submitting, $submitting => $submitting && $superformData.authType === 'passkey')

  // passlock has verified apple's response, now we're submitting the principal to +page.server.ts
  const submittingApple = derived(submitting, $submitting => $submitting && $superformData.authType === 'apple')

  // passlock has verified google's response, now we're submitting the principal to +page.server.ts
  const submittingGoogle = derived(submitting, $submitting => $submitting && $superformData.authType === 'google')

  const submitForm = async () => form.submit()

  $: readonlyEmail = $submittingPasskey || undefined
</script>

<Forms.CenteredPanel>
  <div class="text-center">
    <Forms.Heading>Sign in</Forms.Heading>
    <Forms.SubHeading>
      Not yet a member?
      <Link href="/">Sign up here</Link>
    </Forms.SubHeading>
  </div>

  <div class="mt-5">
    {#if PUBLIC_APPLE_CLIENT_ID || PUBLIC_GOOGLE_CLIENT_ID}
      <div class="grid gap-2">
        {#if PUBLIC_APPLE_CLIENT_ID}
          <Social.Apple context="signin" submitting={$submittingApple} on:principal={updateForm(form, submitForm)} />
        {/if}
        {#if PUBLIC_GOOGLE_CLIENT_ID}
          <Social.Google context="signin" submitting={$submittingGoogle} on:principal={updateForm(form, submitForm)} />
        {/if}
        <Forms.Divider />
      </div>
    {/if}

    <form method="post" action={loginAction} use:enhance>
      <div class="flex flex-col gap-4">
        <Forms.InputEmail {form} field="email" label="Email address" autocomplete="email" readonly={readonlyEmail} />

        <Forms.SubmitButton submitting={$submittingPasskey}>
          <Icons.Passkey class="size-5 fill-current" slot="icon" />
          Sign in with Passkey
        </Forms.SubmitButton>

        <Forms.PoweredBy />
      </div>
    </form>
  </div>
</Forms.CenteredPanel>

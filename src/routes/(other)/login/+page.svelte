<script lang="ts">
  import Link from '$lib/components/layout/Link.svelte'

  import {
    PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'

  import * as Icons from '$lib/components/icons'
  import * as Forms from '$lib/components/ui/forms'
  import * as Google from '$lib/components/ui/google'

  import { SveltePasslock, getLocalEmail, saveEmailLocally, updateForm } from '$lib/passlock.js'
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

  const submittingPasskey = derived(submitting, $submitting => $submitting && $superformData.authType === 'passkey')

  const submittingGoogle = derived(submitting, $submitting => $submitting && $superformData.authType === 'google')

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
    {#if PUBLIC_GOOGLE_CLIENT_ID}
      <Google.Button operation="login" submitting={$submittingGoogle} on:principal={updateForm(form, true)} />
      <Forms.Divider />
    {/if}

    <form method="POST" use:enhance>
      <div class="flex flex-col gap-4">
        <Forms.InputEmail {form} field="email" label="Email address" autocomplete="email" readonly={readonlyEmail} />

        <Forms.SubmitButton submitting={$submittingPasskey}>
          <Icons.Passkey class="size-5 fill-current" slot="icon" />
          Sign in with Passkey
        </Forms.SubmitButton>
      </div>

      <Forms.PoweredBy />
    </form>
  </div>
</Forms.CenteredPanel>

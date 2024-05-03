<script lang="ts">
  import Link from '$lib/components/layout/Link.svelte'

  import { 
    PUBLIC_PASSLOCK_CLIENT_ID, 
    PUBLIC_PASSLOCK_ENDPOINT, 
    PUBLIC_PASSLOCK_TENANCY_ID,
    PUBLIC_GOOGLE_CLIENT_ID
  } from '$env/static/public'

  import * as Forms from '$lib/components/ui/forms'
  import * as Google from '$lib/components/ui/google'
  import * as Icons from '$lib/components/icons'

  import { SveltePasslock, updateForm, saveEmailLocally, getLocalEmail } from '$lib/passlock.js'
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
  $: readonly = $formData.token?.length > 0 ? true : undefined
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
      <Google.Button operation="login" on:principal={updateForm(form, true)} />
      <Forms.Divider />
    {/if}

    <form method="POST" use:enhance>
      <div class="flex flex-col gap-4">
        <Forms.InputEmail {form} field="email" label="Email address" autocomplete="email" {readonly} />

        {#if $formData.token}
          <Forms.SubmitButton requestPending={$delayed}>
            <Icons.Google class="size-4" slot="icon" />
            Sign in with Google
          </Forms.SubmitButton>
        {:else}
          <Forms.SubmitButton requestPending={$delayed}>
            <Icons.Passkey class="size-5 fill-current" slot="icon" />
            Sign in with Passkey
          </Forms.SubmitButton>
        {/if}
      </div>

      <Forms.PoweredBy />
    </form>
  </div>
</Forms.CenteredPanel>

<script lang="ts">
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
  import * as Icons from '$lib/components/icons'
  import * as Forms from '$lib/components/ui/forms'
  import { verifyEmailSchema } from '$lib/schemas'
  import { Passlock } from '@passlock/sveltekit/superforms'
  import { onMount } from 'svelte'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

  export let data: PageData

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

  const form = superForm(data.form, {
    validators: valibotClient(verifyEmailSchema),
    delayMs: 0,

    onSubmit: async ({ formData, cancel }) => {
      await passlock.verifyEmail({ form, formData, cancel })
    }
  })

  const { enhance, submitting, form: formData, errors } = form
  $: disabled = $formData.code.length < 6 || $submitting

  onMount(() => {
    passlock.autoVerifyEmail(form)
  })
</script>

<Forms.CenteredPanel>
  <form method="post" use:enhance>
    <div class="flex flex-col gap-5">
      <div class="text-center">
        <Forms.Heading>Verify your email</Forms.Heading>
        <Forms.SubHeading>Please click below to verify your email</Forms.SubHeading>
      </div>

      <input type="hidden" name="code" bind:value={$formData.code} />

      {#if $errors.code}
        <div class="text-sm text-center text-red-600 dark:text-red-400">
          <ul>
            {#each $errors.code as error}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <Forms.SubmitButton {disabled} submitting={$submitting}>
        <Icons.Passkey class="size-5 fill-current" slot="icon" />
        Verify email
      </Forms.SubmitButton>
    </div>
  </form>
</Forms.CenteredPanel>

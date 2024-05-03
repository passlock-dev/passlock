<script lang="ts">
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
  import { SveltePasslock } from '$lib/passlock'
  import { verifyEmailSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

  import * as Icons from '$lib/components/icons'
  import * as Forms from '$lib/components/ui/forms'

  export let data: PageData

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new SveltePasslock({ tenancyId, clientId, endpoint })

  const form = superForm(data.form, {
    validators: valibotClient(verifyEmailSchema),
    delayMs: 0,

    onSubmit: async ({ formData, cancel }) => {
      await passlock.verifyEmail({ form, formData, cancel })
    }
  })

  const resend = async () => {
    if (data.user) {
      resendDisabled = true
      await passlock.resendEmail({ userId: data.user.id, method: 'code' })
      setTimeout(() => {
        resendDisabled = false
      }, 1000)
    }
  }

  const { enhance, submitting, form: formData } = form
  $: disabled = $formData.code.length < 6 || $submitting

  let resendDisabled = false
</script>

<Forms.CenteredPanel>
  <form method="post" use:enhance>
    <div class="flex flex-col gap-5">
      <div class="text-center">
        <Forms.Heading>Enter your code</Forms.Heading>
        <Forms.SubHeading>
          We've emailed an authentication code to you. Please check your emails (including junk)
        </Forms.SubHeading>
      </div>

      <Forms.MultiFieldPin {form} field="code" on:complete={() => form.submit()} />

      <p class="text-center text-sm text-base-600 dark:text-base-400">
        Still waiting?
        <button type="button" on:click={resend} disabled={resendDisabled} class="link-primary">Resend the code</button>
      </p>

      <Forms.SubmitButton {disabled} submitting={$submitting}>
        <Icons.Passkey class="size-5 fill-current" slot="icon" />
        Verify email
      </Forms.SubmitButton>
    </div>
  </form>
</Forms.CenteredPanel>

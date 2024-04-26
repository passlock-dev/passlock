<script lang="ts">
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
  import CenteredPanel from '$lib/forms/CenteredPanel.svelte'
  import Heading from '$lib/forms/Heading.svelte'
  import PIN from '$lib/forms/MultiFieldPIN.svelte'
  import SubHeading from '$lib/forms/SubHeading.svelte'
  import SubmitButton from '$lib/forms/SubmitButton.svelte'
  import Passkey from '$lib/icons/Passkey.svelte'
  import { SveltePasslock } from '$lib/passlock'
  import { verifyEmailSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

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

  const { enhance, delayed, form: formData } = form
  $:disabled = $formData.code.length < 6 || $delayed
  let resendDisabled = false
</script>

<CenteredPanel>
  <form method="post" use:enhance>
    <div class="flex flex-col gap-5">
      <div class="text-center">
        <Heading>Enter your code</Heading>
        <SubHeading>
          We've emailed an authentication code to you. Please check your
          emails (including junk)
        </SubHeading>
      </div>

      <PIN {form} field="code" on:complete={() => console.log("complete" )} />

      <p class="text-center text-sm text-base-600 dark:text-base-400">
          Still waiting?
          <button
            on:click={resend} 
            disabled={resendDisabled}
            class="link-primary">
            Resend the code
          </button>
      </p>      

      <SubmitButton {disabled} requestPending={$delayed}>
        <Passkey slot="icon" />
        Verify email
      </SubmitButton>
    </div>
  </form>
</CenteredPanel>

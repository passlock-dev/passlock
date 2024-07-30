<script lang="ts">
  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import { MultiFieldPIN } from '$lib/components/ui/pin'
  import { verifyEmailSchema } from '$lib/schemas'
  import { Passlock } from '@passlock/sveltekit/superforms'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

  import * as Icons from '$lib/components/icons'
  import { ThemeSelector } from '$lib/components/theme'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Forms from '$lib/components/ui/forms'
  import Logo from '$lib/components/ui/logo'

  export let data: PageData

  const passlock = new Passlock({
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT
  })

  const form = superForm(data.form, {
    validators: valibotClient(verifyEmailSchema),
    delayMs: 0,

    onSubmit: async ({ formData, cancel }) => {
      await passlock.verifyEmail({ form, formData, cancel })
    }
  })

  let resendDisabled = false

  const resend = async () => {
    if (data.user) {
      resendDisabled = true
      await passlock.resendEmail({ user_id: data.user.id, method: 'code' })
      setTimeout(() => {
        resendDisabled = false
      }, 1000)
    }
  }

  const { enhance, submitting } = form
</script>

<div class="relative h-full w-full flex justify-center items-center">
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector />
  </div>

  <Logo />

  <form method="post" use:enhance>
    <Card.Root class="w-full max-w-sm">
      <Card.Header>
        <Card.Title class="text-2xl text-center">Enter your code</Card.Title>
        <Card.Description class="text-center">
          We've sent you a verification code. <br />
          Please check your emails (including junk)
        </Card.Description>
      </Card.Header>
      <Card.Content class="grid gap-4">
        <MultiFieldPIN {form} field="code" on:complete={() => form.submit()} />
      </Card.Content>
      <Card.Footer class="flex flex-col">
        <Forms.SubmitButton submitting={$submitting}>
          <Icons.Mail class="h-4 w-4" slot="icon" />
          Verify email
        </Forms.SubmitButton>
        <div class="mt-4 text-center text-sm">
          {#if resendDisabled}
            Email sent
          {:else}
            Still waiting?
            <button
              on:click={() => resend()}
              type="button"
              class="hover:underline">
              Resend code
            </button>
          {/if}
        </div>
      </Card.Footer>
    </Card.Root>
  </form>
</div>

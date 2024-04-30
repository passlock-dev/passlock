<script lang="ts">
  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import { MultiFieldPIN } from '$lib/components/ui/pin'
  import { SveltePasslock } from '$lib/passlock'
  import { verifyEmailSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import Logo from '$lib/components/ui/logo'
  import { ThemeSelector } from '$lib/components/theme'
  import * as Icons from '$lib/components/icons'

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

  let resendDisabled = false

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
          Enter your verification code below
        </Card.Description>
      </Card.Header>
      <Card.Content class="grid gap-4">
        <MultiFieldPIN {form} field="code" />
      </Card.Content>
      <Card.Footer class="flex flex-col">
        <Button class="col-span-2 flex gap-2" type="submit">
          {#if $delayed}
            <Icons.spinner class="h-4 w-4 animate-spin" />
          {:else}
            <Icons.mail class="h-4 w-4" />
          {/if}
          Verify email
        </Button>
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

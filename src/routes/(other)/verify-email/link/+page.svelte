<script lang="ts">
  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import { SveltePasslock } from '$lib/passlock'
  import { verifyEmailSchema } from '$lib/schemas'
  import { superForm } from 'sveltekit-superforms'
  import { valibotClient } from 'sveltekit-superforms/adapters'
  import type { PageData } from './$types'

  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import Logo from '$lib/components/ui/logo'
  import { ThemeSelector } from '$lib/components/theme'

  
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

  const pinClass =
    'block text-center border border-gray-200 rounded-md text-sm font-mono font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-base-900 dark:border-gray-700 dark:text-base-400 dark:focus:ring-gray-600 size-[46px]'

  const { enhance, delayed, form: formData } = form
  $: disabled = $formData.code.length < 6 || $delayed
  let resendDisabled = false
</script>

<div class="relative h-full w-full flex justify-center items-center">
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector />
  </div>

  <Logo />
  
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl text-center">Verify your email</Card.Title>
      <Card.Description class="text-center">
        Please click below to verify your email
      </Card.Description>
    </Card.Header>
    <Card.Footer class="flex flex-col">
      <Button class="w-full">Verify email</Button>
      <div class="mt-4 text-center text-sm">
        Still waiting?
        <a href="/" class="underline">Resend code</a>
      </div>
    </Card.Footer>
  </Card.Root>
</div>

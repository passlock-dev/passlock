<script lang="ts">
  import {
    PUBLIC_PASSLOCK_CLIENT_ID,
    PUBLIC_PASSLOCK_ENDPOINT,
    PUBLIC_PASSLOCK_TENANCY_ID
  } from '$env/static/public'
  import { Passlock } from '@passlock/sveltekit/superforms'
  import type { PageData } from './$types'

  import { ThemeSelector } from '$lib/components/theme'
  import * as Card from '$lib/components/ui/card/index.js'
  import Logo from '$lib/components/ui/logo'

  export let data: PageData

  const passlock = new Passlock({
    tenancyId: PUBLIC_PASSLOCK_TENANCY_ID,
    clientId: PUBLIC_PASSLOCK_CLIENT_ID,
    endpoint: PUBLIC_PASSLOCK_ENDPOINT
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

  let resendDisabled = false
</script>

<div class="relative h-full w-full flex justify-center items-center">
  <div class="absolute right-4 top-4 right-8 top-8 flex items-center gap-4">
    <ThemeSelector />
  </div>

  <Logo />

  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl text-center">Check your emails</Card.Title>
      <Card.Description class="text-center">
        We've sent you a link. <br />
        Please check your emails (including junk)
      </Card.Description>
    </Card.Header>
    <Card.Footer>
      <div class="w-full text-sm text-center">
        Still waiting?
        <a href="#" on:click={resend} class="underline">Resend code</a>
      </div>
    </Card.Footer>
  </Card.Root>
</div>

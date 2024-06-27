<script lang="ts">
  import { page } from '$app/stores'
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from '$env/static/public'
  import * as Forms from '$lib/components/ui/forms'
  import { SveltePasslock } from '$lib/passlock'
  import { verifyEmailLink } from '$lib/routes'
  import type { PageData } from './$types'

  export let data: PageData

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new SveltePasslock({ tenancyId, clientId, endpoint })

  let resendDisabled = false

  const resend = async () => {
    if (data.user) {
      resendDisabled = true
      const redirectUrl = new URL(verifyEmailLink, $page.url).href
      await passlock.resendEmail({ userId: data.user.id, method: 'link', redirectUrl })
      setTimeout(() => {
        resendDisabled = false
      }, 1000)
    }
  }
</script>

<Forms.CenteredPanel>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <Forms.Heading>Check your email</Forms.Heading>
      <Forms.SubHeading>
        We've emailed a verification link to you. Please check your emails (including junk)
      </Forms.SubHeading>
    </div>

    <p class="text-center text-sm text-base-600 dark:text-base-400">
      Still waiting?
      <button
        on:click={resend}
        disabled={resendDisabled}
        class="
          decoration-2
          hover:underline
          font-medium
          text-blue-600
          dark:text-blue-500
          disabled:opacity-50
          disabled:cursor-not-allowed">
        Resend the code
      </button>
    </p>
  </div>
</Forms.CenteredPanel>

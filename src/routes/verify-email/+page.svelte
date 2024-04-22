<!--
  A single page which handles 3 scenarios:

  1. We've emailed the user a verification link
  2. We've emailed the user a code
  3. They clicked the link in the mail
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { PUBLIC_PASSLOCK_CLIENT_ID, PUBLIC_PASSLOCK_ENDPOINT, PUBLIC_PASSLOCK_TENANCY_ID } from "$env/static/public";
  import AwaitEmail from "$lib/email/AwaitEmail.svelte";
  import ConfirmVerification from "$lib/email/ConfirmVerification.svelte";
  import EnterCode from "$lib/email/EnterCode.svelte";
  import { Passlock } from "@passlock/client";
  import type { PageData } from "./$types";

  const endpoint = PUBLIC_PASSLOCK_ENDPOINT
  const tenancyId = PUBLIC_PASSLOCK_TENANCY_ID
  const clientId = PUBLIC_PASSLOCK_CLIENT_ID

  const passlock = new Passlock({ tenancyId, clientId, endpoint })

  export let data: PageData

  const resendEmail = async () => {
    if (data.user && data.method === 'link') {
      await passlock.resendVerificationEmail({ 
        userId: data.user.id, 
        method: 'link' ,
        redirectUrl: String(new URL('/verify-email', $page.url))
      })
    } else if (data.user && data.method === 'code') {
      await passlock.resendVerificationEmail({ 
        userId: data.user.id, 
        method: 'code' 
      })
    }
  }
</script>

<div class="h-full flex justify-center items-center">
  {#if data.code}
    <!-- We emailed a link which they clicked. Prompt them to confirm -->
    <ConfirmVerification on:verified={() => goto('/')} {passlock} code={data.code} /> 
  {:else if data.method === 'code'}
    <!-- We emailed a code, prompt them to enter it -->
    <EnterCode on:verified={() => goto('/')} on:resendEmail={resendEmail} {passlock} />    
  {:else if data.method === 'link'}
    <!-- We emailed a link, prompt them to check their emails -->
    <AwaitEmail on:resendEmail={resendEmail} />
  {/if}
</div>
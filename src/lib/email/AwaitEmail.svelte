<!--
  Tell the user we emailed them a verification link.
  Give them the option to resend the email
-->
<script lang="ts">
  import CenteredPanel from "$lib/forms/CenteredPanel.svelte";
  import Heading from "$lib/forms/Heading.svelte";
  import SubHeading from "$lib/forms/SubHeading.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ resendEmail: void }>()

  let allowResend = true

  const resend = () => {
    dispatch('resendEmail')
    allowResend = false
  }
</script>

<CenteredPanel>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <Heading>Check your email</Heading>
      <SubHeading>
        We've emailed a verification link to you. Please check your emails (including junk)
      </SubHeading>
    </div>

    <p class="text-center text-sm text-gray-600 dark:text-gray-400">
      {#if allowResend}
        Still waiting?
        <a href={'#'} on:click={resend} class="text-blue-600 dark:text-blue-500 decoration-2 hover:underline font-medium">
          Resend the link
        </a>
      {:else}
        Email sent
      {/if}
    </p>
  </div>
</CenteredPanel> 
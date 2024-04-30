<!--
  @component
  Mobile dropdown menu
-->
<script lang="ts">
  import * as Icons from '$lib/components/icons'
  import type { User } from 'lucia'

  export let user: User | undefined
</script>

<div class="flex flex-col gap-5 mt-5">
  {#if user}
    <form method="post" action="/logout">
      <button type="submit" class="flex gap-2 items-center font-medium text-base-800 dark:text-base-200">
        <Icons.Logout class="size-4" />
        Logout
      </button>
    </form>
  {:else}
    <a href="/login" class="link">
      <Icons.User class="size-4" />
      Login
    </a>

    <a href="/" class="btn btn-primary">Sign up</a>
  {/if}
</div>

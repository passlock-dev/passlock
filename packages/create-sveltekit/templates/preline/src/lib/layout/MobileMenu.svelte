<!--
  @component
  Mobile dropdown menu
-->
<script lang="ts">
  import * as Icons from '$lib/icons'
  import { login, logoutAction } from '$lib/routes'
  import type { User } from 'lucia'

  export let user: User | null
</script>

<div class="flex flex-col gap-5 mt-5">
  {#if user}
    <form method="post" action={logoutAction}>
      <button type="submit" class="flex gap-2 items-center font-medium text-base-800 dark:text-base-200">
        <Icons.Logout class="size-4" />
        Logout
      </button>
    </form>
  {:else}
    <a href={login} class="link">
      <Icons.User class="size-4" />
      Login
    </a>

    <a href="/#signupForm" class="link">
      <Icons.Plus class="size-4" />
      Sign up
    </a>
  {/if}
</div>

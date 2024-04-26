<!--
  @component
  Mobile dropdown menu
-->
<script lang="ts">
  import Login from "$lib/icons/Login.svelte"
  import Logout from "$lib/icons/Logout.svelte"
  import type { User } from "lucia"

  export let user: User | undefined
</script>

<div class="flex flex-col gap-5 mt-5">
  {#if user}
    <form method="post" action="/logout">
      <button type="submit" class="flex gap-2 items-center font-medium text-base-800 dark:text-base-200">
        <Logout />
        Logout
      </button>
    </form>
  {:else}
    <a href="/login" class="link">
      <Login />
      Login
    </a>

    <a
      href="/register"
      class="btn btn-primary">
      Sign up
    </a>
  {/if}
</div>

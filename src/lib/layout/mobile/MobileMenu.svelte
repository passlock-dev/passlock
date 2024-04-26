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

<div class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
  <button class="text-left font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Landing</button>

  <button class="text-left font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Account</button>

  <button class="text-left font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Our work</button>

  <button class="text-left font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Blog</button>

  <div class="border-b border-slate-800/30 dark:border-white/30"></div>

  {#if user}
    <form method="post" action="/logout">
      <button type="submit" class="flex gap-2 items-center font-medium text-slate-800 dark:text-slate-200">
        <Logout />
        Logout
      </button>
    </form>
  {:else}
    <a href="/login" class="flex items-center gap-x-2 font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">
      <Login />
      Login
    </a>

    <a
      href="/register"
      class="
        py-2 px-3
        inline-flex
        items-center
        gap-x-2 text-sm
        font-medium rounded-lg
        shadow-sm
        disabled:opacity-50
        disabled:pointer-events-none
        bg-blue-600
        hover:bg-blue-700
        text-white">
      Sign up
    </a>
  {/if}
</div>

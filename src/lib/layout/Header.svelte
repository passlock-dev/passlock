<script lang="ts">
  import { beforeNavigate } from '$app/navigation'
  import { PUBLIC_ORG_NAME } from '$env/static/public'
  import type { User } from 'lucia'
  import { slide } from 'svelte/transition'
  import Avatar from './Avatar.svelte'
  import LoginLink from './LoginLink.svelte'
  import RegisterButton from './RegisterButton.svelte'
  import ThemeSelector from './ThemeSelector.svelte'
  import MenuToggle from './MenuToggle.svelte'

  export let user: User | undefined

  // Mobile menu
  let menuVisible = false

  beforeNavigate(() => {
    // close the menu
    menuVisible = false
  })
</script>

<header
  class="flex-none flex flex-wrap sm:justify-start sm:flex-nowrap w-full text-sm py-4">
  <nav
    class="relative w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between"
    aria-label="Global">
    <div class="flex items-center justify-between">
      <a
        class="flex-none text-xl font-semibold text-slate-800 dark:text-slate-100"
        href="/">
        {PUBLIC_ORG_NAME}
      </a>

      <div class="flex items-center gap-4 sm:hidden">
        <ThemeSelector />
        {#if user}
          <Avatar {user} />
        {/if}
        <MenuToggle bind:visible={menuVisible} />
      </div>
    </div>

    <!-- Mobile dropdown -->
    {#if menuVisible}
      <div
        transition:slide
        class="absolute left-0 px-4 pb-6 w-full grow sm:hidden z-10 bg-white dark:bg-slate-950">
        <div
          class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
          {#if !user}
            <LoginLink />
            <RegisterButton />
          {/if}
        </div>
      </div>
    {/if}

    <!-- Desktop menu -->
    <div class="hidden grow sm:block">
      <div
        class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
        <ThemeSelector />
        {#if user}
          <Avatar {user} />
        {:else}
          <LoginLink />
          <RegisterButton />
        {/if}
      </div>
    </div>
  </nav>
</header>

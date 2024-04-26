<!--
  @component
  Desktop nav bar including the theme selector and avatar / user menu
-->
<script lang="ts">
  import Login from '$lib/icons/Login.svelte'
  import { createAvatar, createMenubar, melt } from '@melt-ui/svelte'
  import type { User } from 'lucia'
  import { setMode, mode } from 'mode-watcher'

  export let user: User | undefined

  const selectMode = (mode: 'light' | 'dark' | 'system') => () => {
    setMode(mode)
  }
 
  const {
    elements: { menubar },
    builders: { createMenu }
  } = createMenubar()

  const {
    elements: { menu: productMenu, item: productItem, trigger: productTrigger }
  } = createMenu({ arrowSize: 20 })

  const {
    elements: { menu: themeMenu, item: themeItem, trigger: themeTrigger }
  } = createMenu()

  const {
    elements: { image, fallback }
  } = createAvatar({
    src: user?.avatar ?? ''
  })

  const {
    elements: { menu: userMenu, item: userItem, trigger: userTrigger }
  } = createMenu()

  let logoutForm: HTMLFormElement
</script>

<div use:melt={$menubar} class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
  <button class="font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Landing</button>

  <button class="font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Account</button>

  <button class="font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Our work</button>

  <button class="font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">Blog</button>

  <!-- Product dropdown -->
  <button use:melt={$productTrigger} tabindex="0" class="flex gap-1 items-center sm:border-r sm:border-slate-800/30 sm:dark:border-white/30 sm:pr-4 font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">
    Product
    <svg class="ms-1 flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  </button>

  <div
    use:melt={$productMenu}
    class="mt-4 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Pricing
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Changelog
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Docs
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Download
    </a>
  </div>
  <!-- // Product dropdown -->

  <!-- Theme selector -->
  <button
    type="button"
    tabindex="0"
    use:melt={$themeTrigger}
    aria-label="Select theme"
    class="size-5 relative flex items-center font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">
    {#if $mode && $mode === 'dark'}
      <svg
        class="absolute size-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    {:else if $mode}
      <svg
        class="absolute size-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
    {/if}
  </button>

  <div
    use:melt={$themeMenu}
    class="mt-4 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
    <button
      use:melt={$themeItem}
      on:click={selectMode('light')}
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Default (Light)
    </button>
    <button
      use:melt={$themeItem}
      on:click={selectMode('dark')}
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Dark
    </button>
    <button
      use:melt={$themeItem}
      on:click={selectMode('system')}
      type="button"
      class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
      Auto (System)
    </button>
  </div>
  <!-- // Theme selector -->

  <!-- User menu-->
  {#if user}
    <button tabindex="0" use:melt={$userTrigger} class="flex size-8 items-center justify-center rounded-full bg-gray-100">
      <img
        use:melt={$image}
        class="h-full w-full rounded-[inherit]"
        src={user.avatar}
        alt="Gravatar for {user.givenName} {user.familyName}" />
      <span
        use:melt={$fallback}
        class="text-lg font-medium text-gray-700 uppercase">
        {user.initials}
      </span>
    </button>

    <div
      use:melt={$userMenu}
      class="mt-4 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
      <button
        use:melt={$userItem}
        on:m-click={() => logoutForm.requestSubmit()}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Logout
      </button>
    </div>

    <form class="hidden" bind:this={logoutForm} method="post" action="/logout">
      <button type="submit" class="font-medium text-slate-800 dark:text-slate-200">
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
  <!-- // User menu-->
</div>

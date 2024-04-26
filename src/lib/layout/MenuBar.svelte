<!--
  @component
  Desktop nav bar including the theme selector and avatar / user menu
-->
<script lang="ts">
  import Login from '$lib/icons/Login.svelte'
  import Moon from '$lib/icons/Moon.svelte'
  import Sun from '$lib/icons/Sun.svelte'
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

  const linkClass = 'flex gap-2 items-center font-medium hover:text-blue-500 dark:hover:text-blue-400 text-base-800 dark:text-base-200 '
</script>

<div use:melt={$menubar} class="flex flex-col gap-5 mt-5 sm:flex-row sm:items-center sm:justify-end sm:mt-0 sm:ps-5">
  <button class={linkClass}>Landing</button>

  <button class={linkClass}>Account</button>

  <button class={linkClass}>Our work</button>

  <button class={linkClass}>Blog</button>

  <!-- Product dropdown -->
  <button use:melt={$productTrigger} tabindex="0" class="{linkClass} flex gap-1 items-center sm:border-r sm:border-base-800/30 sm:dark:border-white/30 sm:pr-4">
    Product
    <svg class="ms-1 flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  </button>

  <div
    use:melt={$productMenu}
    class="dd-menu">
    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="dd-menu-item">
      Pricing
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="dd-menu-item">
      Changelog
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="dd-menu-item">
      Docs
    </a>

    <a
      use:melt={$productItem}
      href="#"
      type="button"
      class="dd-menu-item">
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
    class="text-base size-5 relative flex items-center font-medium hover:text-blue-500 dark:hover:text-blue-400">
    {#if $mode && $mode === 'dark'}
      <Moon />
    {:else if $mode}
      <Sun />
    {/if}
  </button>

  <div
    use:melt={$themeMenu}
    class="dd-menu">
    <button
      use:melt={$themeItem}
      on:click={selectMode('light')}
      type="button"
      class="dd-menu-item">
      Default (Light)
    </button>
    <button
      use:melt={$themeItem}
      on:click={selectMode('dark')}
      type="button"
      class="dd-menu-item">
      Dark
    </button>
    <button
      use:melt={$themeItem}
      on:click={selectMode('system')}
      type="button"
      class="dd-menu-item">
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
        class="text-lg font-medium text-base-700 uppercase">
        {user.initials}
      </span>
    </button>

    <div
      use:melt={$userMenu}
      class="dd-menu">
      <button
        use:melt={$userItem}
        on:m-click={() => logoutForm.requestSubmit()}
        type="button"
        class="dd-menu-item">
        Logout
      </button>
    </div>

    <form class="hidden" bind:this={logoutForm} method="post" action="/logout">
      <button type="submit" class="text-base font-medium">
        Logout
      </button>
    </form>
  {:else}
    <a href="/login" class={linkClass}>
      <Login />
      Login
    </a>

    <a href="/register" class="btn btn-primary">
      Sign up
    </a>
  {/if}
  <!-- // User menu-->
</div>

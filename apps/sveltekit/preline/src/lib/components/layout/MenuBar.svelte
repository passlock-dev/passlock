<!--
  @component
  Desktop nav bar including the theme selector and avatar / user menu
-->
<script lang="ts">
  import * as Icons from '$lib/components/icons'
  import { login, logout } from '$lib/routes'
  import { createAvatar, createMenubar, melt } from '@melt-ui/svelte'
  import type { User } from 'lucia'
  import { mode, setMode } from 'mode-watcher'

  export let user: User | null

  const selectMode = (mode: 'light' | 'dark' | 'system') => () => {
    setMode(mode)
  }

  const {
    elements: { menubar },
    builders: { createMenu }
  } = createMenubar()

  const {
    elements: { menu: themeMenu, item: themeItem, trigger: themeTrigger }
  } = createMenu()

  const {
    elements: { menu: userMenu, item: userItem, trigger: userTrigger }
  } = createMenu()

  const {
    elements: { image, fallback }
  } = createAvatar({
    src: user?.avatar ?? ''
  })

  let logoutForm: HTMLFormElement
</script>

<div use:melt={$menubar} class="flex flex-row gap-5 items-center justify-end ps-5">
  <!-- Theme selector -->
  <button type="button" tabindex="0" use:melt={$themeTrigger} aria-label="Select theme" class="link size-5">
    {#if $mode && $mode === 'dark'}
      <Icons.Moon class="size-4" />
    {:else if $mode}
      <Icons.Sun class="size-4" />
    {/if}
  </button>

  <div use:melt={$themeMenu} class="dd-menu">
    <button use:melt={$themeItem} on:click={selectMode('light')} type="button" class="dd-menu-item">
      Default (Light)
    </button>
    <button use:melt={$themeItem} on:click={selectMode('dark')} type="button" class="dd-menu-item">Dark</button>
    <button use:melt={$themeItem} on:click={selectMode('system')} type="button" class="dd-menu-item">
      Auto (System)
    </button>
  </div>
  <!-- // Theme selector -->

  <div class="border-r border-base-200 dark:border-base-600">&nbsp;</div>

  <!-- User menu-->
  {#if user}
    <button
      tabindex="0"
      use:melt={$userTrigger}
      class="flex size-8 items-center justify-center rounded-full bg-gray-100">
      <img
        use:melt={$image}
        class="h-full w-full rounded-[inherit]"
        src={user.avatar}
        alt="Gravatar for {user.givenName} {user.familyName}" />
      <span use:melt={$fallback} class="text-lg font-medium text-base-700 uppercase">
        {user.initials}
      </span>
    </button>

    <div use:melt={$userMenu} class="dd-menu">
      <button use:melt={$userItem} on:m-click={() => logoutForm.requestSubmit()} type="button" class="dd-menu-item">
        Logout
      </button>
    </div>

    <form class="hidden" bind:this={logoutForm} method="post" action={logout}>
      <button type="submit" class="text-base font-medium">Logout</button>
    </form>
  {:else}
    <a href={login} class="link">
      <Icons.User class="size-4" />
      Login
    </a>

    <a href="/" class="btn btn-primary">Sign up</a>
  {/if}
  <!-- // User menu-->
</div>

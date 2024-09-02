<!--
  @component
  Desktop nav bar including the theme selector and avatar / user menu
-->
<script lang="ts">
  import * as Icons from '$lib/icons'
  import { login, logoutAction } from '$lib/routes'
  import { createAvatar, createMenubar, melt } from '@melt-ui/svelte'
  import type { User } from 'lucia'
  import { mode, setMode } from 'mode-watcher'
  import Avatar from './Avatar.svelte'

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
    <Avatar {user} />
  {:else}
    <a href={login} class="link">
      <Icons.User class="size-4" />
      Login
    </a>

    <a href="/" class="btn btn-primary">Sign up</a>
  {/if}
  <!-- // User menu-->
</div>

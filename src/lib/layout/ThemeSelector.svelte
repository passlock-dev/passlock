<!-- 
  Theme selector which supports three states:

  Light
  Dark
  Device (auto)

  Changes are persisted in local storage.

  Note: uses Tailwind's class based selector strategy.
-->

<script lang="ts">
  import { browser } from "$app/environment";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";

  export const themeKey = 'theme'

  let html: HTMLElement | null
  let isDark = false
  let dropDownVisible = false
  let ready = false

  const toggleDropDown = () => {
    dropDownVisible = !dropDownVisible
  }

  /**
   * Note how we don't toggle isDark directly.
   * Instead we update the html classes, which in turn triggers
   * the mutation observer.
   */
  const toggle = (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      html?.classList.remove('light')
      html?.classList.add('dark')
    } else {
      html?.classList.remove('dark')
      html?.classList.add('light')
    }
  }

  const activateDark = () => {
    toggle('dark')
    localStorage.setItem(themeKey, 'dark')
    dropDownVisible = false
  } 

  const activateLight = () => {
    toggle('light')
    localStorage.setItem(themeKey, 'light')
    dropDownVisible = false
  }

  // listen for changes to html class attribute
  let htmlClassObserver: MutationObserver

  // listen for changes to the prefers-color-scheme
  let mediaMatcher: MediaQueryList

  // listen for prefers-color-scheme changes
  const mediaListener = (cb: { matches: boolean }) => {
    const preferredTheme = localStorage.getItem(themeKey)

    if (!preferredTheme && cb.matches) {
      toggle('dark')
    } else if (!preferredTheme) {
      toggle('light')
    }
  }

  const activateSystem = () => {
    localStorage.removeItem(themeKey)
    mediaListener(window.matchMedia('(prefers-color-scheme: dark)'))
    dropDownVisible = false
  }

  /**
   * UI state is driven by the state of the html class attribute or the
   * prefers-color-scheme media matcher. We do it this way to ensure:
   * 
   * 1. The UI state reflects system changes e.g. when the devices switches
   * from light to dark.
   * 
   * 2. We can run theme selection code in the head, before this component
   * has loaded. This prevents any 'flash' caused by the default theme being
   * replaced when this component mounts.
   */
  onMount(() => {
    mediaMatcher = window.matchMedia('(prefers-color-scheme: dark)')
    mediaMatcher.addEventListener('change', mediaListener)

    html = document.querySelector('html')
    
    htmlClassObserver = new MutationObserver(() => {
      isDark = html?.classList.contains('dark') || false
    })

    isDark = html?.classList.contains('dark') || false

    html && htmlClassObserver.observe(html, {
      attributes: true, 
      attributeFilter: ['class'] 
    }) 

    ready = true
  })

  onDestroy(() => {
    if (browser) {
      htmlClassObserver?.disconnect()
      mediaMatcher?.removeEventListener('change', mediaListener)
    }
  })
</script>

<svelte:head>
  <script>
    /**
     * By running this in the head we can ensure the preferred theme is selected
     * BEFORE the component mounts. This avoids any flash as the preferred theme
     * kicks in. Otherwise the default (light) theme would be selected, then when
     * the component finally mounts it may switch over to dark.
     */
    function initTheme() {
      html = document.querySelector('html')
      const preferedTheme = localStorage.getItem('theme')
      const prefersDarkScheme = window?.matchMedia('(prefers-color-scheme: dark)').matches || false

      if (html && preferedTheme === 'dark') {
        html.classList.remove('light')
        html.classList.add('dark')
      } else if (html && preferedTheme === 'light') {
        html.classList.remove('dark')
        html.classList.add('light')
      } else if (prefersDarkScheme) {
        html.classList.remove('light')
        html.classList.add('dark')
      }
    }

    initTheme()
  </script>
</svelte:head>

<div class="relative">
  <button type="button" on:click={toggleDropDown} class="size-5 relative flex items-center font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">
    {#if ready && isDark}
      <svg transition:fade class="absolute size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    {:else if ready}
      <svg transition:fade class="absolute size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  {#if dropDownVisible}
    <div transition:fade class="absolute z-10 w-40 top-10 -left-14 origin-bottom-left bg-white shadow-md rounded-lg p-2 space-y-1 dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
      <button on:click={activateLight} type="button" class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Default (Light)
      </button>
      <button on:click={activateDark} type="button" class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Dark
      </button>
      <button on:click={activateSystem} type="button" class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Auto (System)
      </button>
    </div>
  {/if}
</div>
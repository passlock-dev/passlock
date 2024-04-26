<script lang="ts">
  import { createDropdownMenu, melt } from '@melt-ui/svelte'
  import { setMode, mode } from 'mode-watcher'
  import { fade } from 'svelte/transition'

  const {
    elements: { menu, item, trigger },
    states: { open }
  } = createDropdownMenu()

  const selectMode = (mode: 'light' | 'dark' | 'system') => () => {
    setMode(mode)
    $open = false
  }
</script>

<div class="relative">
  <button
    type="button"
    use:melt={$trigger}
    aria-label="Select theme"
    class="size-5 relative flex items-center font-medium text-slate-800 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400">
    {#if $mode && $mode === 'dark'}
      <svg
        transition:fade
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
        transition:fade
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
    <span class="sr-only">Open Popover</span>
  </button>

  {#if $open}
    <div
      use:melt={$menu}
      class="mt-4 w-40 shadow-md rounded-lg p-2 space-y-1 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 dark:divide-gray-700">
      <button
        use:melt={$item}
        on:click={selectMode('light')}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Default (Light)
      </button>
      <button
        use:melt={$item}
        on:click={selectMode('dark')}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Dark
      </button>
      <button
        use:melt={$item}
        on:click={selectMode('system')}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
        Auto (System)
      </button>
    </div>
  {/if}
</div>

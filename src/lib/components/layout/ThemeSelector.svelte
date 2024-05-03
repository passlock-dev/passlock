<script lang="ts">
  import * as Icons from '$lib/components/icons'
  import { createDropdownMenu, melt } from '@melt-ui/svelte'
  import { mode, setMode } from 'mode-watcher'

  const {
    elements: { menu, item, trigger },
    states: { open }
  } = createDropdownMenu()

  const selectMode = (mode: 'light' | 'dark' | 'system') => () => {
    setMode(mode)
    $open = false
  }
</script>

<div class="relative border-slate-800/30">
  <button
    type="button"
    use:melt={$trigger}
    aria-label="Select theme"
    class="
      size-5
      relative
      flex
      items-center
      font-medium
      text-base-800
      hover:text-blue-500
      dark:text-base-200
      dark:hover:text-blue-400">
    {#if $mode && $mode === 'dark'}
      <Icons.Moon class="size-4" />
    {:else if $mode}
      <Icons.Sun class="size-4" />
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
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-200 dark:hover:bg-gray-700">
        Default (Light)
      </button>
      <button
        use:melt={$item}
        on:click={selectMode('dark')}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-200 dark:hover:bg-gray-700">
        Dark
      </button>
      <button
        use:melt={$item}
        on:click={selectMode('system')}
        type="button"
        class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-200 dark:hover:bg-gray-700">
        Auto (System)
      </button>
    </div>
  {/if}
</div>

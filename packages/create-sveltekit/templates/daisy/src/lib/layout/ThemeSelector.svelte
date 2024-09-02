<script lang="ts">
  import * as Icons from '$lib/icons'
  import { createDropdownMenu, melt } from '@melt-ui/svelte'
  import { onMount } from 'svelte'

  type Modes = 'light' | 'dark' | 'system'
  let mode: Modes = 'system'

  const {
    elements: { menu, item, trigger },
    states: { open }
  } = createDropdownMenu()

  const selectMode = (requestedMode: Modes) => () => {
    mode = requestedMode
    document.getElementsByTagName('html')[0].dataset['theme'] = mode
    localStorage.setItem('mode', mode)
    $open = false
  }

  onMount(() => {
    const storedMode = localStorage.getItem('mode')
    if (!storedMode) return

    switch (storedMode) {
      case 'light':
        mode = 'light'
        break
      case 'dark':
        mode = 'dark'
        break
      case 'system':
        mode = 'system'
        break
      default:
        mode = 'system'
    }
  })
</script>

<svelte:head>
  <script>
    if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
      const mode = localStorage.getItem('mode')

      if (mode) {
        const htmlElement = document.getElementsByTagName('html')
        if (htmlElement && htmlElement.length > 0) {
          htmlElement[0].dataset['theme'] = mode
        }
      }
    }
  </script>
</svelte:head>

<div class="relative">
  <button
    type="button"
    use:melt={$trigger}
    aria-label="Select theme"
    class="
      size-5
      relative
      flex
      items-center
      font-medium">
    {#if mode && mode === 'dark'}
      <Icons.Moon class="size-4" />
    {:else if mode}
      <Icons.Sun class="size-4" />
    {/if}
    <span class="sr-only">Open Popover</span>
  </button>

  {#if $open}
    <ul use:melt={$menu} class="mt-2 w-40 menu bg-base-200 rounded-lg">
      <li>
        <button
          use:melt={$item}
          on:click={selectMode('light')}
          type="button"
          class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm">
          Default (Light)
        </button>
      </li>
      <li>
        <button
          use:melt={$item}
          on:click={selectMode('dark')}
          type="button"
          class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm">
          Dark
        </button>
      </li>
      <li>
        <button
          use:melt={$item}
          on:click={selectMode('system')}
          type="button"
          class="w-full flex items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm">
          Auto (System)
        </button>
      </li>
    </ul>
  {/if}
</div>

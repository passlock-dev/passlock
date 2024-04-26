<!--
  @component
  Placeholder language selector. 
-->
<script lang="ts">
  import { createPopover, melt } from '@melt-ui/svelte'
  import type { SvelteComponent } from 'svelte'

  import EN from './EN.svelte'
  import DE from './DE.svelte'
  import DK from './DK.svelte'
  import IT from './IT.svelte'
  import JP from './JP.svelte'

  type langs = 'en' | 'de' | 'dk' | 'it' | 'jp'

  const {
    elements: { trigger, content },
    states: { open }
  } = createPopover()

  let selected: typeof SvelteComponent<{}> = EN

  const select = (lang: langs) => () => {
    switch (lang) {
      case 'en':
        selected = EN
        break
      case 'de':
        selected = DE
        break
      case 'dk':
        selected = DK
        break
      case 'it':
        selected = IT
        break
      case 'jp':
        selected = JP
        break
    }

    open.set(false)
  }
</script>

<div class="relative inline-flex [--placement:top-left]">
  <button
    type="button"
    use:melt={$trigger}
    aria-label="Update dimensions"
    class="btn btn-secondary font-normal">
    <svelte:component this={selected} />
    <svg
      class:rotate-180={$open}
      class="flex-shrink-0 size-4 text-base-600"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
    <span class="sr-only">Open Popover</span>
  </button>

  {#if $open}
    <div
      use:melt={$content}
      class="absolute -top-52 w-40 transition-[opacity,margin] duration z-10 bg-white shadow-md rounded-lg p-2 dark:bg-gray-800 dark:border dark:border-gray-700 dark:divide-gray-700"
      aria-labelledby="footer-language-dropdown">
      <button
        on:click={select('en')}
        class="w-full flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-400 dark:hover:bg-gray-700 dark:hover:text-base-300">
        <EN />
      </button>
      <button
        on:click={select('de')}
        class="w-full flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-400 dark:hover:bg-gray-700 dark:hover:text-base-300">
        <DE />
      </button>
      <button
        on:click={select('dk')}
        class="w-full flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-400 dark:hover:bg-gray-700 dark:hover:text-base-300">
        <DK />
      </button>
      <button
        on:click={select('it')}
        class="w-full flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-400 dark:hover:bg-gray-700 dark:hover:text-base-300">
        <IT />
      </button>
      <button
        on:click={select('jp')}
        class="w-full flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm text-base-800 hover:bg-gray-100 dark:text-base-400 dark:hover:bg-gray-700 dark:hover:text-base-300">
        <JP />
      </button>
    </div>
  {/if}
</div>

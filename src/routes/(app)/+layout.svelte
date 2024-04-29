<script lang="ts">
  import { ModeWatcher } from 'mode-watcher'
  import '../../app.pcss'
  import type { LayoutData } from './$types'

  export let data: LayoutData
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<ModeWatcher />

<div class="h-screen flex flex-col bg-white dark:bg-slate-950">
  <main class="grow">
    <slot />
  </main>
</div>

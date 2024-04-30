<script lang="ts">
  import Banner from '$lib/components/ui/banner'
  import '../../app.pcss'
  import { ModeWatcher } from 'mode-watcher'
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<ModeWatcher />

<div class="h-screen flex flex-col bg-white dark:bg-slate-950">
  <Banner>
    <p class="text-white">
      <span class="font-semibold">Demo</span> - Please try registration, email verification & login
    </p>
  </Banner>

  <main class="grow">
    <slot />
  </main>
</div>

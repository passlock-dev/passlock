<script lang="ts">
  import Banner from '$lib/components/ui/banner'
  import { ModeWatcher } from 'mode-watcher'
  import '../../app.pcss'
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<ModeWatcher />

<div class="h-screen flex flex-col bg-white dark:bg-slate-950">
  <Banner>
    <p class="text-white">
      <span class="font-semibold">Demo</span>
       - Please try registration, email verification & login
    </p>
  </Banner>

  <main class="grow">
    <slot />
  </main>
</div>

<style>
  /* See https://stackoverflow.com/a/43519235 */
  @media (prefers-color-scheme: dark) {
    :global(input:not(input:-webkit-autofill)::-webkit-contacts-auto-fill-button) {
      background-color: #fff;
    }
  }
</style>

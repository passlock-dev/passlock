<script lang="ts">
  import { ModeWatcher } from 'mode-watcher'
  import '../../app.pcss'
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

<style>
  /* See https://stackoverflow.com/a/43519235 */
  @media (prefers-color-scheme: dark) {
    :global(input:not(input:-webkit-autofill)::-webkit-contacts-auto-fill-button) {
      background-color: #fff;
    }
  }
</style>

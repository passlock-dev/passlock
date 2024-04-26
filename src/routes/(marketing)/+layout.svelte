<script lang="ts">
  import '../../app.pcss'
  import Footer from '$lib/layout/Footer.svelte'
  import Header from '$lib/layout/Header.svelte'
  import type { LayoutData } from './$types'
  import { ModeWatcher } from 'mode-watcher'
  import Banner from '$lib/layout/Banner.svelte'

  export let data: LayoutData
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<ModeWatcher />

<div class="h-screen flex flex-col bg-white dark:bg-slate-950">
  <Banner />
  
  <Header user={data.user} />

  <main class="pt-2 pb-8 px-8 grow">
    <slot />
  </main>

  <Footer />
</div>

<style>
  /* See https://stackoverflow.com/a/43519235 */
  @media (prefers-color-scheme: dark) {
    :global(
        input:not(input:-webkit-autofill)::-webkit-contacts-auto-fill-button
      ) {
      background-color: #fff;
    }
  }
</style>

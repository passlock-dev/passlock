<script lang="ts">
  import "../app.pcss";
  import Footer from "$lib/layout/Footer.svelte";
  import Header from "$lib/layout/Header.svelte";
  import type { LayoutData } from "./$types";

  export let data: LayoutData
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<div class="h-screen flex flex-col bg-white dark:bg-slate-950">
  <Header user={data.user} />

  <main class="pt-2 pb-8 px-8 grow">
    <slot />
  </main>
  
  <Footer />
</div>

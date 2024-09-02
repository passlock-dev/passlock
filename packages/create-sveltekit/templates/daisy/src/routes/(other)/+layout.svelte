<script lang="ts">
  import Banner from '$lib/layout/Banner.svelte'
  import Footer from '$lib/layout/Footer.svelte'
  import Header from '$lib/layout/Header.svelte'
  import '../../app.pcss'
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
  <script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" async></script>
</svelte:head>

<div class="h-screen flex flex-col">
  <Banner />

  <Header user={null} />

  <main class="grow">
    <slot />
  </main>

  <Footer />
</div>

<style>
  /* See https://stackoverflow.com/a/43519235 */
  @media (prefers-color-scheme: dark) {
    :global(input:not(input:-webkit-autofill)::-webkit-contacts-auto-fill-button) {
      background-color: #fff;
    }
  }
</style>

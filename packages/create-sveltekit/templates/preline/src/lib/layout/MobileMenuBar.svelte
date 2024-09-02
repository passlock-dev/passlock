<!--
  @component
  Mobile menu bar. Includes theme selector, avatar and dropdown toggle
-->
<script lang="ts">
  import type { User } from 'lucia'
  import ThemeSelector from './ThemeSelector.svelte'
  import MobileAvatar from './Avatar.svelte'
  import MobileMenuToggle from './MobileMenuToggle.svelte'

  export let user: User | null
  export let menuOpen = false
</script>

<ThemeSelector />

{#if user}
  <MobileAvatar {user} />
{/if}

<MobileMenuToggle bind:visible={menuOpen} />

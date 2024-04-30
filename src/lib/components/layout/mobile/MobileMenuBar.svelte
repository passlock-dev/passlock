<!--
  @component
  Mobile menu bar. Includes theme selector, avatar and dropdown toggle
-->
<script lang="ts">
  import type { User } from 'lucia'
  import MobileAvatar from './MobileAvatar.svelte'
  import MobileMenuToggle from './MobileMenuToggle.svelte'
  import ThemeSelector from '../ThemeSelector.svelte'

  export let user: User | undefined
  export let menuOpen = false
</script>

<ThemeSelector />

{#if user}
  <MobileAvatar {user} />
{/if}

<MobileMenuToggle bind:visible={menuOpen} />

<!--
  @component
  
  Submit button that swaps the icon for a spinner when a request is pending/in flight

  Usage:

  ```html
  <SubmitButton {requestPending} disabled={true}>
    <svg slot="icon">...</svg>
    Sign up
  </SubmitButton>
  ```
-->
<script lang="ts">
  import Spinner from '../icons/Spinner.svelte'

  export let disabled = false

  export let requestPending = false
</script>

<button
  {disabled}
  type="submit"
  class="btn btn-primary w-full py-3 px-4">
  {#if requestPending}
    <Spinner />
  {:else}
    <slot name="icon" />
  {/if}
  <slot />
</button>

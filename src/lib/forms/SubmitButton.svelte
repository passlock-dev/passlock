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
  class="
    w-full
    py-3 px-4
    inline-flex
    justify-center
    items-center
    gap-x-2
    text-sm
    font-semibold
    rounded-lg
    border
    border-transparent
    bg-blue-600
    hover:bg-blue-700
    text-white
    disabled:opacity-50
    disabled:pointer-events-none">
  {#if requestPending}
    <Spinner />
  {:else}
    <slot name="icon" />
  {/if}
  <slot />
</button>

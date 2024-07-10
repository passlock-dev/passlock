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
  import * as Icons from '$lib/components/icons'
  export let disabled = false
  export let submitting = false
</script>

<button disabled={disabled || submitting} type="submit" class="btn btn-primary w-full py-3 px-4">
  {#if submitting}
    <Icons.Spinner class="size-4 animate-spin-slow" />
  {:else}
    <slot name="icon" />
  {/if}
  <slot />
</button>

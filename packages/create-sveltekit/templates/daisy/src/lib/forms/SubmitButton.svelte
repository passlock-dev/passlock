<!--
  @component
  
  Submit button that swaps the icon for a spinner when a request is pending

  Usage:

  ```html
  <SubmitButton {submitting} disabled={true}>
    <svg slot="icon">...</svg>
    Sign up
  </SubmitButton>
  ```
-->
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import * as Icons from '$lib/icons'

  type $$Props = Omit<HTMLButtonAttributes, 'disabled'> & {
    disabled?: boolean | undefined
    submitting?: boolean | undefined
  }

  export let disabled = false
  export let submitting = false
</script>

<button
  disabled={disabled || submitting}
  type="submit"
  class="btn btn-primary w-full py-3 px-4 {$$restProps['class']}"
  tabindex="0">
  {#if submitting}
    <Icons.Spinner class="size-4 animate-spin-slow" />
  {:else}
    <slot name="icon" />
  {/if}
  <slot />
</button>

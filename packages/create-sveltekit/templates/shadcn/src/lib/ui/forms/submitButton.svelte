<script lang="ts">
  import * as Icons from '$lib/icons'
  import { Button } from '$lib/ui/button/index.js'
  import type { HTMLButtonAttributes } from 'svelte/elements'

  type $$Props = Omit<HTMLButtonAttributes, 'disabled'> & {
    disabled?: boolean | undefined
    submitting?: boolean | undefined
  }

  export let disabled = false
  export let submitting = false
</script>

<Button disabled={disabled || submitting} type="submit" class="col-span-2 flex gap-2 {$$restProps.class}">
  {#if submitting}
    <Icons.Spinner class="h-4 w-4 animate-spin-slow" />
  {:else}
    <slot name="icon" />
  {/if}

  <slot />
</Button>

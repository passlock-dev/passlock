<script lang="ts">
  import * as Icons from '$lib/components/icons'
  import { Button } from '$lib/components/ui/button/index.js'

  export let disabled = false
  export let submitting = false
</script>

<Button
  disabled={disabled || submitting}
  type="submit"
  class="col-span-2 flex gap-2">
  {#if submitting}
    <Icons.Spinner class="h-4 w-4 animate-spin-slow" />
  {:else}
    <slot name="icon" />
  {/if}

  <slot />
</Button>

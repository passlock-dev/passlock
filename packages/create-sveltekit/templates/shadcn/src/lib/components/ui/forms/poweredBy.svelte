<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { SvelteHTMLElements } from 'svelte/elements'

  type $$Props = SvelteHTMLElements['div']

  let className: $$Props['class'] = undefined
  export { className as class }
</script>

<div
  class={cn('text-sm text-center text-muted-foreground', className)}
  {...$$restProps}>
  Powered by <a class="hover:underline" href="https://passlock.dev">Passlock</a>
</div>

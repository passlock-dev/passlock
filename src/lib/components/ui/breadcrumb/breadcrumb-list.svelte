<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { HTMLOlAttributes } from 'svelte/elements'

  type $$Props = HTMLOlAttributes & {
    el?: HTMLOListElement
  }

  export let el: $$Props['el'] = undefined
  let className: $$Props['class'] = undefined
  export { className as class }
</script>

<ol
  bind:this={el}
  class={cn(
    'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
    className
  )}
  {...$$restProps}>
  <slot />
</ol>

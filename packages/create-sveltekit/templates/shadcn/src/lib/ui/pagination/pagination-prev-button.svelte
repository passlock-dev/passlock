<script lang="ts">
  import { Button } from '$lib/ui/button/index.js'
  import { cn } from '$lib/utils.js'
  import { Pagination as PaginationPrimitive } from 'bits-ui'
  import ChevronLeft from 'lucide-svelte/icons/chevron-left'

  type $$Props = PaginationPrimitive.PrevButtonProps
  type $$Events = PaginationPrimitive.PrevButtonEvents

  let className: $$Props['class'] = undefined
  export { className as class }
</script>

<PaginationPrimitive.PrevButton asChild let:builder>
  <Button variant="ghost" class={cn('gap-1 pl-2.5', className)} builders={[builder]} on:click {...$$restProps}>
    <slot>
      <ChevronLeft class="h-4 w-4" />
      <span>Previous</span>
    </slot>
  </Button>
</PaginationPrimitive.PrevButton>

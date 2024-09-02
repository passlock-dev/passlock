<script lang="ts">
  import { cn } from '$lib/utils.js'
  import { Dialog as SheetPrimitive } from 'bits-ui'

  type $$Props = SheetPrimitive.TitleProps

  let className: $$Props['class'] = undefined
  export { className as class }
</script>

<SheetPrimitive.Title class={cn('text-lg font-semibold text-foreground', className)} {...$$restProps}>
  <slot />
</SheetPrimitive.Title>

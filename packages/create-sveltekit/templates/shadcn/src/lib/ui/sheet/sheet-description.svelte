<script lang="ts">
  import { cn } from '$lib/utils.js'
  import { Dialog as SheetPrimitive } from 'bits-ui'

  type $$Props = SheetPrimitive.DescriptionProps

  let className: $$Props['class'] = undefined
  export { className as class }
</script>

<SheetPrimitive.Description class={cn('text-sm text-muted-foreground', className)} {...$$restProps}>
  <slot />
</SheetPrimitive.Description>

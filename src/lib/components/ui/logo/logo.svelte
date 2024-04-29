<script lang="ts">
  import { cn } from "$lib/utils"

  let className: string | undefined = undefined
  export { className as class }
</script>

<div class={cn("absolute left-8 top-9 flex items-center gap-2 text-lg font-medium z-20", className)}>
  <a href="/">Acme Inc</a>
</div>
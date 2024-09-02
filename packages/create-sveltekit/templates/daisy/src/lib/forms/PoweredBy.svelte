<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements'

  type $$Props = SvelteHTMLElements['div']
</script>

<div class="text-sm text-center" {...$$restProps}>
  Powered by <a class="hover:underline" href="https://passlock.dev">Passlock</a>
</div>

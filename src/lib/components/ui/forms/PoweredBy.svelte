<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements'

  type $$Props = SvelteHTMLElements['div']
</script>

<div class={'text-sm text-center text-base-400 dark:text-base-500'} {...$$restProps}>
  Powered by <a class="hover:underline" href="https://passlock.dev">Passlock</a>
</div>

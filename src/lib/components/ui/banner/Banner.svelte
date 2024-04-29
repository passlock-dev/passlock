<script lang="ts">
  import { Button } from "$lib/components/ui/button"

  let visible = true
</script>

{#if visible}
  <div class="bg-slate-800">
    <div class="px-4 py-2 mx-auto">
      <div class="flex items-center justify-between">
        <div>&nbsp;</div>

        <slot />

        <Button variant="outline" size="icon" on:click={() => visible = false}>
          <svg class="flex-shrink-0 size-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>
    </div>
  </div>
{/if}
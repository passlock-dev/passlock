<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- TODO Delete me -->
<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
	<h2 class="text-center text-xl font-semibold">Developer notes</h2>
	<div class="mt-4">
		{@render children()}
	</div>
</div>

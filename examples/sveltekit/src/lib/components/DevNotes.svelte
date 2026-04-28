<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PUBLIC_ENABLE_DEV_NOTES } from '$env/static/public';

	let { children }: { children: Snippet } = $props();
</script>

{#if PUBLIC_ENABLE_DEV_NOTES === 'true'}
	<!-- Rendered callout used throughout the sample to explain non-obvious auth and
  passkey behaviour without cluttering the main page copy. -->
	<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
		<h2 class="text-center text-xl font-semibold">Developer notes</h2>
		<div class="mt-4">
			{@render children()}
		</div>
	</div>
{/if}

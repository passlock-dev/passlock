<script lang="ts" generics="T extends Record<string, unknown>">
	import type { SuperForm } from 'sveltekit-superforms/client';
	let { superform }: { superform: SuperForm<T> } = $props();

	// svelte-ignore state_referenced_locally
	let { errors } = superform;
</script>

{#if $errors._errors}
	{#each $errors._errors as error (error)}
		<p class="mt-3 max-w-xs text-center text-sm text-error">{error}</p>
	{/each}
{/if}

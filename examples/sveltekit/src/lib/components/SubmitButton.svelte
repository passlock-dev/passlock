<script lang="ts">
	import { Loader } from '@lucide/svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	let {
		loading,
		disabled,
		class: clazz,
		children,
		onclick
	}: HTMLButtonAttributes & {
		loading?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button class={['btn', 'mt-4', 'btn-primary', 'w-full', clazz]} {disabled} {onclick}>
	{#if loading}
		<Loader class="animate-spin duration-[4s]" />
	{:else}
		{@render children?.()}
	{/if}
</button>

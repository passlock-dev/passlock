<script lang="ts" module>
	type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { formFieldProxy, type SuperForm, type FormPathLeaves } from 'sveltekit-superforms';

	type Props = HTMLInputAttributes & {
		superform: SuperForm<T>;
		field: FormPathLeaves<T>;
		label?: string;
	};

	let { superform, field, class: clazz, label, ...rest }: Props = $props();
	// svelte-ignore state_referenced_locally
	const { value, errors, constraints } = formFieldProxy(superform, field);
</script>

{#if label}
	<label for={field} class="label">{label}</label>
{/if}

<input
	id={field}
	type="email"
	name={field}
	bind:value={$value}
	aria-invalid={$errors ? 'true' : undefined}
	class={['input', clazz, { 'input-error': $errors }]}
	{...$constraints}
	{...rest} />

{#if $errors}
	{#each $errors as error (error)}
		<span class="text-error">{error}</span>
	{/each}
{/if}

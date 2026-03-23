<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const { form, errors } = superForm(data.form);
</script>

<svelte:head>
	<title>Password Login</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="POST" class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login</h2>

		<fieldset class="fieldset w-xs">
			<label for="username" class="label">Email</label>
			<input
				id="username"
				type="email"
				name="username"
				class="input text-base-content/60"
				value={data.username}
				readonly />

			<p class="mt-2 text-sm">
				Not you?
				<a href={resolve('/login')} class="ml-1 text-primary hover:underline">Change email</a>
			</p>

			<label for="password" class="label mt-2">Password</label>
			<input
				id="password"
				type="password"
				autocomplete="current-password"
				name="password"
				class={['input', { 'input-error': $errors.password }]}
				bind:value={$form.password}
				required />
			{#if $errors.password}<span class="text-error">{$errors.password}</span>{/if}

			<button class="btn mt-4 btn-primary">Login</button>
		</fieldset>

		<p class="mt-4 text-center text-sm">
			Prefer passkeys?
			<a href={resolve('/login/passkey')} class="ml-1 text-primary hover:underline">
				Login using your passkey
			</a>
		</p>
		<p class="mt-1 text-center text-sm">
			Not yet a member? <a href={resolve('/signup')} class="ml-1 text-primary hover:underline">
				Sign up
			</a>
		</p>
	</form>
</div>

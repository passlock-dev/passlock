<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/* can be ignored as superforms uses stores for dynamic state */
	// svelte-ignore state_referenced_locally
	const { form, errors } = superForm(data.form);
</script>

<svelte:head>
	<title>Create an account</title>
</svelte:head>

<div class="mx-auto flex h-full max-w-5xl items-center justify-center">
	<div class="flex flex-col items-center lg:flex-row lg:gap-8">
		<div class="px-2 text-center lg:text-left">
			<h1 class="text-5xl font-bold">Sign up today!</h1>
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
		</div>

		<form method="post">
			<fieldset class="fieldset rounded-box border border-base-300 bg-base-200 p-10 lg:w-sm">
				<label for="givenName" class="label">First name</label>
				<input
					id="givenName"
					type="text"
					autocomplete="given-name"
					name="givenName"
					class="input"
					bind:value={$form.givenName}
					required />

				<label for="email" class="label mt-2">Email</label>
				<input
					id="email"
					type="email"
					name="email"
					autocomplete="email"
					class={['input', { 'input-error': $errors.email }]}
					bind:value={$form.email}
					required />
				{#if $errors.email}<span class="text-error">{$errors.email}</span>{/if}

				<label for="password" class="label mt-2">Password</label>
				<input
					id="password"
					type="password"
					autocomplete="new-password"
					name="password"
					class="input"
					bind:value={$form.password}
					required />

				<button class="btn mt-4 btn-primary">Sign up</button>
			</fieldset>
		</form>
	</div>
</div>

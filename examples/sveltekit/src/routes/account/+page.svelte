<script lang="ts">
	import { setError, superForm } from 'sveltekit-superforms';
	import { updatePasslockUsernames } from '$lib/client/passlock';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, message, enhance } = superForm(data.form, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		onUpdated: async ({ form }) => {
			await updatePasskeys(form.data.username);
		}
	});

	const updatePasskeys = async (username: string) => {
		const { tenancyId, endpoint } = data;

		const result = await updatePasslockUsernames({ username, tenancyId, endpoint });
		if (result._tag === '@error/UpdatePasskeyError') {
			setError(data.form, result.message);
		}
	};
</script>

<svelte:head>
  <title>My Account</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="POST" use:enhance class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">My account</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			Update your username and first name.
		</p>

		{#if $message}
			<p class="my-2 text-center text-sm text-success">{$message}</p>
		{:else if $errors._errors}
			{#each $errors._errors as error (error)}
				<span class="text-error">{error}</span>
			{/each}
		{/if}

		<fieldset class="fieldset">
			<label for="username" class="label mt-2">Username</label>
			<input
				id="username"
				type="email"
				name="username"
				autocomplete="email"
				class={['input', { 'input-error': $errors.username }]}
				bind:value={$form.username}
				required />
			{#if $errors.username}
				{#each $errors.username as error (error)}
					<span class="text-error">{error}</span>
				{/each}
			{/if}

			<label for="givenName" class="label mt-2">First name</label>
			<input
				id="givenName"
				type="text"
				name="givenName"
				autocomplete="given-name"
				class={['input', { 'input-error': $errors.givenName }]}
				bind:value={$form.givenName}
				required />
			{#if $errors.givenName}
				{#each $errors.givenName as error (error)}
					<span class="text-error">{error}</span>
				{/each}
			{/if}

			<button class="btn mt-4 btn-primary">Save changes</button>
		</fieldset>
	</form>
</div>

<!-- TODO Delete me -->
<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
	<h2 class="text-center text-xl font-semibold">Developer notes</h2>
	<p class="mt-2">
    We want to align passkeys with any account changes. 
    Therefore changes to the account email result in several operations:
  </p>

	<ol class="mt-2 list-inside list-decimal">
		<li>The local application database is updated.</li>
		<li class="mt-2">All associated passkeys are updated in the user's device/password manager.</li>
		<li class="mt-2">The passkey username is updated in your Passlock vault.</li>
	</ol>

	<p class="mt-2 font-semibold">
		Test this by updating your username then visiting the
		<a href={resolve('/passkeys')} class="link text-primary">passkeys</a>
		page and checking your local passkey manager 🚀
	</p>
</div>

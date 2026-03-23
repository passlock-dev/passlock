<script lang="ts">
	import { setError, superForm } from 'sveltekit-superforms';
	import { updateUserPasskeys } from '$lib/client/passkeys';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import DevNotes from '$lib/components/DevNotes.svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form, errors, message, enhance } = superForm(data.form, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		onUpdated: async ({ form }) => {
			const result = await updateUserPasskeys({ ...data, ...form.data });
			if (result._tag === '@error/UpdatePasskeyError') {
				setError(data.form, result.message);
			}
		}
	});
</script>

<svelte:head>
	<title>My Account</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="POST" use:enhance class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">My account</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			Update your username, first name, and last name.
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

			<div class="mt-2 grid gap-4 sm:grid-cols-2">
				<div>
					<label for="givenName" class="label">First name</label>
					<input
						id="givenName"
						type="text"
						name="givenName"
						autocomplete="given-name"
						class={['input w-full', { 'input-error': $errors.givenName }]}
						bind:value={$form.givenName}
						required />
					{#if $errors.givenName}
						{#each $errors.givenName as error (error)}
							<span class="text-error">{error}</span>
						{/each}
					{/if}
				</div>

				<div>
					<label for="familyName" class="label">Last name</label>
					<input
						id="familyName"
						type="text"
						name="familyName"
						autocomplete="family-name"
						class={['input w-full', { 'input-error': $errors.familyName }]}
						bind:value={$form.familyName}
						required />
					{#if $errors.familyName}
						{#each $errors.familyName as error (error)}
							<span class="text-error">{error}</span>
						{/each}
					{/if}
				</div>
			</div>

			<button class="btn mt-4 btn-primary">Save changes</button>
			<a href={resolve('/account/delete')} class="btn mt-3 btn-outline btn-error">
				Delete account
			</a>
		</fieldset>
	</form>
</div>

<!-- TODO Delete me -->
<DevNotes>
	<p>
		We want to align passkeys with any account changes. Therefore changes to the account username or
		name result in several operations:
	</p>

	<ol class="mt-2 list-inside list-decimal">
		<li>The local application database is updated.</li>
		<li class="mt-2">All associated passkeys are updated in the user's device/password manager.</li>
		<li class="mt-2">The passkey username and display name are updated in your Passlock vault.</li>
	</ol>

	<p class="mt-2 font-semibold">
		Test this by updating your username or name, then visiting the
		<a href={resolve('/passkeys')} class="link text-primary">passkeys</a>
		page and checking your local passkey manager 🚀
	</p>
</DevNotes>

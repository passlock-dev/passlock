<script lang="ts">
	import AccountReauthentication from '#lib/components/AccountReauthentication.svelte';
	import { resolve } from '$app/paths';
	import { reAuthenticateIfNecessary } from '../utils.js';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { deleteAccountSchema } from './schema.js';
	import { Loader } from '@lucide/svelte';

	let { data }: PageProps = $props();
	let reauthentication: AccountReauthentication;
	let passkeyCount = $derived(data.passkeyCount);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed, submitting, validateForm } = superForm(data.form, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(deleteAccountSchema),
		onSubmit: async ({ cancel }) => {
			// Account deletion is sensitive, so reuse the same account re-auth
			// helper used by the profile/email forms before allowing submission.
			const authResult = await reAuthenticateIfNecessary(
				{
					errors,
					validateForm: () => validateForm({ update: true })
				},
				() => reauthentication.confirm()
			);

			if (authResult._tag === '@error/ReAuthenticationFailure') {
				cancel();
				return;
			}
		}
	});
</script>

<AccountReauthentication
	bind:this={reauthentication}
	config={{ tenancyId: data.tenancyId, endpoint: data.endpoint }} />

<svelte:head>
	<title>Delete Account</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="post" use:enhance class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Delete account</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			This permanently deletes <span class="font-semibold">{data.user.email}</span>
			and all associated authenticators, and signs you out everywhere.
		</p>
		<p class="mt-2 text-center text-sm text-base-content/80">
			{#if passkeyCount === 0}
				Your local account data and sessions will be removed immediately.
			{:else}
				We will delete {passkeyCount} linked {passkeyCount === 1 ? 'passkey' : 'passkeys'}
				from Passlock. Remove any remaining copies manually from your password manager afterwards.
			{/if}
		</p>

		{#if $errors._errors}
			{#each $errors._errors as error (error)}
				<p class="mt-4 text-sm text-error">{error}</p>
			{/each}
		{/if}

		{#if $errors.intent}
			{#each $errors.intent as intentError (intentError)}
				<p class="mt-4 text-sm text-error">{intentError}</p>
			{/each}
		{/if}

		<input type="hidden" name="intent" bind:value={$form.intent} />

		<div class="mt-6 flex gap-3">
			<a href={resolve('account')} class="btn flex-1 btn-neutral">Cancel</a>

			<button class="btn flex-1 btn-error" disabled={$submitting}>
				{#if $delayed}
					<Loader class="animate-spin duration-[4s]" />
				{:else}
					Delete account
				{/if}
			</button>
		</div>
	</form>
</div>

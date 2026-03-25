<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		authenticatePasskey,
		deleteAccountPasskeys,
		getPasskeyStatus
	} from '$lib/client/passkeys';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import type { SuperFormErrors } from 'sveltekit-superforms/client';
	import type { PageProps } from './$types';
	import { deleteAccountSchema } from './schema.js';

	let { data }: PageProps = $props();
	let passkeyCount = $derived(data.passkeyCount);

	let warning = $state('');
	let deletingPasskeys = $state(false);

	type FormErrors = SuperFormErrors<{}>;

	const clearFormErrors = (formErrors: FormErrors) => {
		formErrors.update((current) => ({ ...current, _errors: undefined }));
	};

	const setFormError = (formErrors: FormErrors, message: string) => {
		formErrors.update((current) => ({ ...current, _errors: [message] }));
	};

	const requireAccountPasskeyConfirmation = async (input: {
		errors: FormErrors;
		validateForm: () => Promise<{ valid: boolean }>;
	}) => {
		clearFormErrors(input.errors);
		warning = '';

		const validation = await input.validateForm();
		if (!validation.valid) {
			return null;
		}

		const passkeyStatus = await getPasskeyStatus();
		if (passkeyStatus._tag === '@error/PasskeyStatusError') {
			setFormError(input.errors, passkeyStatus.message);
			return null;
		}

		if (passkeyStatus.passkeyIds.length === 0) {
			return { shouldDeletePasskeys: false };
		}

		if (!passkeyStatus.reauthenticationRequired) {
			return { shouldDeletePasskeys: true };
		}

		const result = await authenticatePasskey({
			tenancyId: data.tenancyId,
			endpoint: data.endpoint,
			existingPasskeys: [...passkeyStatus.passkeyIds],
			userVerification: 'required',
			verificationRoute: '/account/re-authenticate'
		});

		if (result._tag === 'PasslockLoginSuccess') {
			return { shouldDeletePasskeys: true };
		}

		setFormError(input.errors, result.message);
		return null;
	};

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, validateForm } = superForm(data.form, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(deleteAccountSchema),
		onSubmit: async ({ cancel }) => {
			const confirmation = await requireAccountPasskeyConfirmation({
				errors,
				validateForm: () => validateForm({ update: true })
			});

			if (!confirmation) {
				cancel();
				return;
			}

			if (!confirmation.shouldDeletePasskeys) {
				return;
			}

			deletingPasskeys = true;
			const result = await deleteAccountPasskeys();
			deletingPasskeys = false;

			if (result._tag === '@error/DeletePasskeyError') {
				setFormError(errors, result.message);
				cancel();
				return;
			}

			if (result._tag === '@warning/PasskeyDeletePaused') {
				warning = result.message;
			}
		}
	});
</script>

<svelte:head>
	<title>Delete Account</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<form method="POST" use:enhance class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Delete account</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			This permanently deletes <span class="font-semibold">{data.user.email}</span>
			and signs you out everywhere.
		</p>
		<p class="mt-2 text-center text-sm text-base-content/80">
			{#if passkeyCount === 0}
				Your local account data and sessions will be removed immediately.
			{:else}
				We will delete {passkeyCount} linked {passkeyCount === 1 ? 'passkey' : 'passkeys'}
				from Passlock first. Some browsers may still require you to remove them manually from your password
				manager afterwards.
			{/if}
		</p>

		{#if warning}
			<p class="mt-4 text-sm text-warning">{warning}</p>
		{/if}

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
			<a href={resolve('/account')} class="btn flex-1 btn-neutral">Cancel</a>
			<button class="btn flex-1 btn-error" disabled={deletingPasskeys}>
				{#if deletingPasskeys}Deleting passkeys...{:else}Delete account{/if}
			</button>
		</div>
	</form>
</div>

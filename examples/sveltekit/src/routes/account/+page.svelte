<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { updateUserPasskeys } from '$lib/client/passkeys';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import type { PageProps } from './$types';
	import { replaceState } from '$app/navigation';

	let { data }: PageProps = $props();

	let profileSyncError = $state('');
	let emailStatusMessage = $state('');
	let emailStatusError = $state('');
	let syncingUpdatedEmailPasskeys = $state(false);

	$effect(() => {
		emailStatusMessage = data.emailStatusMessage ?? '';
		emailStatusError = data.emailStatusError ?? '';
	});

	const clearEmailQueryState = () => {
		const url = new URL(window.location.href);
		url.searchParams.delete('email-updated');
		url.searchParams.delete('email-error');
		url.searchParams.delete('email');
		replaceState(url, {});
	};

	const syncUpdatedEmailPasskeys = async () => {
		syncingUpdatedEmailPasskeys = true;
		const result = await updateUserPasskeys({
			username: data.email,
			givenName: data.user?.givenName,
			familyName: data.user?.familyName
		});

		if (result._tag === '@error/UpdatePasskeyError') {
			emailStatusError =
				'Email address updated, but local passkeys could not be refreshed automatically.';
			syncingUpdatedEmailPasskeys = false;
			clearEmailQueryState();
			return;
		}

		emailStatusMessage = 'Email address updated and passkeys refreshed.';
		syncingUpdatedEmailPasskeys = false;
		clearEmailQueryState();
	};

	onMount(() => {
		if (data.syncPasskeysOnLoad) {
			void syncUpdatedEmailPasskeys();
			return;
		}

		if (data.emailUpdated || data.emailStatusError) {
			clearEmailQueryState();
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: profileForm,
		errors: profileErrors,
		message: profileMessage,
		enhance: profileEnhance
	} = superForm(data.profileForm, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		onUpdated: async ({ form }) => {
			profileSyncError = '';

			if (!data.hasPasskeys || !form.valid || !form.message) {
				return;
			}

			const result = await updateUserPasskeys({
				username: data.email,
				givenName: form.data.givenName,
				familyName: form.data.familyName
			});

			if (result._tag === '@error/UpdatePasskeyError') {
				profileSyncError = result.message;
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: emailForm,
		errors: emailErrors,
		enhance: emailEnhance
	} = superForm(data.emailForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});
</script>

<svelte:head>
	<title>My Account</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center gap-4 px-4 py-8">
	<fieldset class="mt-4 fieldset max-w-md rounded-lg bg-base-200 p-10 pt-8">
		<form method="POST" action="?/profile" use:profileEnhance>
			<h2 class="text-center text-xl font-semibold">My account</h2>
			<p class="mt-3 text-center text-sm text-base-content/80">
				Update your name and keep your passkeys aligned with your account profile.
			</p>

			{#if $profileMessage}
				<p class="mt-4 text-center text-sm">{$profileMessage}</p>
			{/if}

			{#if profileSyncError}
				<p class="mt-4 text-center text-sm text-error">{profileSyncError}</p>
			{/if}

			<label for="givenName" class="label">First name</label>
			<input
				id="givenName"
				type="text"
				name="givenName"
				autocomplete="given-name"
				class={['input w-full', { 'input-error': $profileErrors.givenName }]}
				bind:value={$profileForm.givenName}
				required />
			{#if $profileErrors.givenName}
				{#each $profileErrors.givenName as error (error)}
					<span class="text-error">{error}</span>
				{/each}
			{/if}

			<label for="familyName" class="label">Last name</label>
			<input
				id="familyName"
				type="text"
				name="familyName"
				autocomplete="family-name"
				class={['input w-full', { 'input-error': $profileErrors.familyName }]}
				bind:value={$profileForm.familyName}
				required />
			{#if $profileErrors.familyName}
				{#each $profileErrors.familyName as error (error)}
					<span class="text-error">{error}</span>
				{/each}
			{/if}

			<button class="btn mt-4 btn-block btn-primary">Save name changes</button>
		</form>

		<div class="divider"></div>

		<form method="POST" action="?/email" use:emailEnhance>
			<h3 class="text-center text-xl font-semibold">Change email address</h3>
			<p class="mt-3 text-center text-sm text-base-content/80">
				We’ll send a verification code to your new email before updating your account.
			</p>

			{#if emailStatusMessage}
				<p class="mt-4 text-center text-sm">{emailStatusMessage}</p>
			{/if}

			{#if syncingUpdatedEmailPasskeys}
				<p class="mt-4 text-center text-sm text-base-content/80">Refreshing your passkeys...</p>
			{/if}

			{#if emailStatusError}
				<p class="mt-4 text-center text-sm text-error">{emailStatusError}</p>
			{/if}

			<label for="account-email" class="label">Current email</label>
			<input
				id="account-email"
				type="email"
				autocomplete="email"
				class="input w-full text-base-content/60"
				value={data.email}
				readonly />

			<label for="new-email" class="label">New email</label>
			<input
				id="new-email"
				type="email"
				name="email"
				autocomplete="email"
				class={['input w-full', { 'input-error': $emailErrors.email }]}
				bind:value={$emailForm.email}
				required />

			{#if $emailErrors.email}
				{#each $emailErrors.email as error (error)}
					<span class="text-error">{error}</span>
				{/each}
			{/if}

			<button class="btn mt-4 btn-block btn-primary">Verify new email</button>
		</form>

		<div class="divider"></div>

		<a href={resolve('/account/delete')} class="btn btn-block btn-outline btn-error">
			Delete account
		</a>
	</fieldset>
</div>

<DevNotes>
	<p>
		Name and email changes both keep passkeys aligned with the local account, the Passlock vault,
		and the user’s device password manager.
	</p>

	<p class="mt-2">
		Email updates are verified first, then the old email address receives an alert notification.
	</p>
</DevNotes>

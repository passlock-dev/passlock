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
	let emailStatusMessage = $derived(data.emailStatusMessage ?? '');
	let emailStatusError = $derived(data.emailStatusError ?? '');
	let syncingUpdatedEmailPasskeys = $state(false);

	const clearEmailQueryState = () => {
		const url = new URL(window.location.href);
		url.searchParams.delete('email-updated');
		url.searchParams.delete('email-error');
		url.searchParams.delete('email');
		replaceState(url, {});
	};

	const syncPasskeys = async () => {
		syncingUpdatedEmailPasskeys = true;
		const result = await updateUserPasskeys({
			username: data.currentEmail,
			givenName: data.user?.givenName,
			familyName: data.user?.familyName
		});

		if (result._tag === '@error/UpdatePasskeyError') {
			emailStatusError = 'Email address updated, but local passkeys could not be refreshed automatically.';
			syncingUpdatedEmailPasskeys = false;
			clearEmailQueryState();
			return;
		}

		emailStatusMessage = 'Email address updated and passkeys refreshed.';
		syncingUpdatedEmailPasskeys = false;
		clearEmailQueryState();
	};

	onMount(() => {
    // after the user verifies their new email address
    // they are redirected here with a ?email-updated=1 flag
    // ultimate this results in the local passkeys being refreshed
		if (data.syncPasskeysOnLoad) {
			void syncPasskeys();
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
				username: data.currentEmail,
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

<div class="flex h-full w-full flex-col items-center justify-start gap-4 px-4 py-8">
	<fieldset class="mt-4 fieldset max-w-md rounded-lg bg-base-200 p-10 pt-8">
		<form method="POST" action="?/profile" use:profileEnhance>
			<h2 class="text-center text-xl font-semibold">My account</h2>
			<p class="mt-3 text-center text-sm text-base-content/80">
				Update your name and keep your passkeys aligned with your account profile.
			</p>

			{#if $profileMessage}
				<p class="mt-4 text-center text-sm text-success">{$profileMessage}</p>
			{/if}

			{#if profileSyncError}
				<p class="mt-4 text-center text-sm text-error">{profileSyncError}</p>
			{/if}

      <div class="mt-4 flex flex-col gap-2">
        <div>
          <label for="givenName" class="label">First name</label>
          <input
            id="givenName"
            type="text"
            name="givenName"
            autocomplete="given-name"
            class={['input w-full mt-2', { 'input-error': $profileErrors.givenName }]}
            bind:value={$profileForm.givenName}
            required />
          {#if $profileErrors.givenName}
            {#each $profileErrors.givenName as error (error)}
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
            class={['input w-full mt-2', { 'input-error': $profileErrors.familyName }]}
            bind:value={$profileForm.familyName}
            required />
          {#if $profileErrors.familyName}
            {#each $profileErrors.familyName as error (error)}
              <span class="text-error">{error}</span>
            {/each}
          {/if}
        </div>
      </div>
			<button class="btn mt-4 btn-block btn-primary">Save name changes</button>
		</form>

		<div class="divider"></div>

		<form method="POST" action="?/email" use:emailEnhance>
			<h3 class="text-center text-xl font-semibold">Change email address</h3>
			<p class="mt-3 text-center text-sm text-base-content/80">
				We’ll send a verification code to your new email before updating your account.
			</p>

			{#if emailStatusMessage}
				<p class="mt-4 text-center text-sm text-success">{emailStatusMessage}</p>
			{/if}

			{#if syncingUpdatedEmailPasskeys}
				<p class="mt-4 text-center text-sm text-base-content/80">Refreshing your passkeys...</p>
			{/if}

			{#if emailStatusError}
				<p class="mt-4 text-center text-sm text-error">{emailStatusError}</p>
			{/if}

      <div class="mt-4 flex flex-col gap-2">
        <div>
          <label for="account-email" class="label">Current email</label>
          <input
            id="account-email"
            type="email"
            autocomplete="email"
            class="input w-full mt-2 text-base-content/60"
            value={data.currentEmail}
            readonly />
        </div>

        <div>
          <label for="new-email" class="label">New email</label>
          <input
            id="new-email"
            type="email"
            name="email"
            autocomplete="email"
            class={['input w-full mt-2', { 'input-error': $emailErrors.email }]}
            bind:value={$emailForm.email}
            required />

          {#if $emailErrors.email}
            {#each $emailErrors.email as error (error)}
              <span class="text-error">{error}</span>
            {/each}
          {/if}
        </div>
      </div>
      
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
		Changing the <span class="font-mono font-semibold">name</span> 
    will also change the display name 
    for any passkeys associated with the current account 
    in the user's local passkey manager.
	</p>

	<p class="mt-2">
		Changing the <span class="font-mono font-semibold">email</span> 
    will first result in a verification code being
    sent to the new address. When the code is entered we:
	</p>

  <ol class="mt-2 ml-2 list-inside list-decimal space-y-2">
    <li>Update the local account</li>
    <li>Update any associated passkeys in the Passlock vault</li>
    <li>Update the passkeys in the user's local passkey manager</li>
    <li>Send a notification email to the <span class="font-semibold">old address</span> 
      informing the user of the change</li>
  </ol>
</DevNotes>

<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { emailSchema, profileSchema } from './schemas.js';
	import { authenticatePasskey, getPasskeyStatus, updateUserPasskeys } from '$lib/client/passkeys';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import type { PageProps } from './$types';
	import { replaceState } from '$app/navigation';
	import type { SuperFormErrors } from 'sveltekit-superforms/client';

	let { data }: PageProps = $props();

	let emailStatusMessage = $derived(data.emailStatusMessage);
	let syncingUpdatedEmailPasskeys = $state(false);

	type FormErrors = SuperFormErrors<{}>;

	// clear form level errors
	const clearFormErrors = (errors: FormErrors) => {
		errors.update((current) => ({ ...current, _errors: undefined }));
	};

	// set a form level error
	const setFormError = (errors: FormErrors, message: string) => {
		errors.update((current) => ({ ...current, _errors: [message] }));
	};

  /**
   * if the user used their passkey recently we can skip re-authentication
   * and just submit the form, otherwise they'll be prompted to authenticate again
   * @param input
   */
	const requireAccountPasskeyConfirmation = async (input: {
		errors: FormErrors;
		validateForm: () => Promise<{ valid: boolean }>;
	}) => {
		clearFormErrors(input.errors);

		// no point going through authentication if the form is invalid
		const validation = await input.validateForm();
		if (!validation.valid) {
			return false;
		}

    // fetch the user's passkeys
		const passkeyStatus = await getPasskeyStatus();
		if (passkeyStatus._tag === '@error/PasskeyStatusError') {
			setFormError(input.errors, passkeyStatus.message);
			return false;
		}

		// recently authenticated so skip passkey auth
		if (!passkeyStatus.reauthenticationRequired || passkeyStatus.passkeyIds.length === 0) {
			return passkeyStatus;
		}

    // prompt user to authenticate again
		const result = await authenticatePasskey({
			tenancyId: data.tenancyId,
			endpoint: data.endpoint,
      // if the user has two accounts we want them to choose the 
      // correct passkey here so we can pre-select it for them
			existingPasskeys: [...passkeyStatus.passkeyIds],
			// we want local re-authentication here
      userVerification: 'required',
      // this route will set the user's passkey authentication timestamp
      // on the session so they don't need to go through this again
      // after we submit the profile or email form the form action
      // will also check this timestamp
			verificationRoute: '/account/re-authenticate'
		});

		if (result._tag === 'PasslockLoginSuccess') {
			return true;
		}

		setFormError(input.errors, result.message);
		return false;
	};

  /**
   * we've displayed the error or synced the passkeys
   * so clear the query params
   */
	const clearEmailQueryState = () => {
		const url = new URL(window.location.href);
		url.searchParams.delete('email-updated');
		url.searchParams.delete('email-error');
		url.searchParams.delete('email');
		replaceState(url, {});
	};

  /**
   * update the passkeys in the user's local passkey
   * manager to align with the new account information
   */
	const syncPasskeys = async () => {
		syncingUpdatedEmailPasskeys = true;
		clearFormErrors(emailErrors);

		const result = await updateUserPasskeys({
			username: data.currentEmail,
			givenName: data.user?.givenName,
			familyName: data.user?.familyName
		});

		if (result._tag === '@error/UpdatePasskeyError') {
			setFormError(
				emailErrors,
				'Email address updated, but local passkeys could not be refreshed automatically.'
			);
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
		// they are redirected back to this route with a ?email-updated=1 flag set
		// ultimately this results in the local passkeys being refreshed
		if (data.syncPasskeysOnLoad) {
			void syncPasskeys();
			return;
		}

		if (data.emailStatusError) {
			setFormError(emailErrors, data.emailStatusError);
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
		enhance: profileEnhance,
		validateForm: validateProfileForm
	} = superForm(data.profileForm, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(profileSchema),
		onSubmit: async ({ cancel }) => {
			const canSubmit = await requireAccountPasskeyConfirmation({
				errors: profileErrors,
				validateForm: () => validateProfileForm({ update: true })
			});

      // something went wrong, abort
			if (!canSubmit) {
				cancel();
			}
		},
		onUpdated: async ({ form }) => {
			clearFormErrors(profileErrors);

			if (!data.hasPasskeys || !form.valid || !form.message) {
				return;
			}

      // refresh the passkeys with the new names 
      // (email/username will be unchanged)
			const result = await updateUserPasskeys({
				username: data.currentEmail,
				givenName: form.data.givenName,
				familyName: form.data.familyName
			});

			if (result._tag === '@error/UpdatePasskeyError') {
				setFormError(profileErrors, result.message);
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const {
		form: emailForm,
		errors: emailErrors,
		enhance: emailEnhance,
		validateForm: validateEmailForm
	} = superForm(data.emailForm, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(emailSchema),
		onSubmit: async ({ cancel }) => {
			const canSubmit = await requireAccountPasskeyConfirmation({
				errors: emailErrors,
				validateForm: () => validateEmailForm({ update: true })
			});

			if (!canSubmit) {
				cancel();
			}
		}
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
				<p class="mt-4 text-center text-sm text-success">{$profileMessage}</p>
			{/if}

			{#if $profileErrors._errors}
				{#each $profileErrors._errors as error (error)}
					<p class="mt-4 text-center text-sm text-error">{error}</p>
				{/each}
			{/if}

			<div class="mt-4 flex flex-col gap-2">
				<div>
					<label for="givenName" class="label">First name</label>
					<input
						id="givenName"
						type="text"
						name="givenName"
						autocomplete="given-name"
						class={['input mt-2 w-full', { 'input-error': $profileErrors.givenName }]}
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
						class={['input mt-2 w-full', { 'input-error': $profileErrors.familyName }]}
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

			{#if $emailErrors._errors}
				{#each $emailErrors._errors as error (error)}
					<p class="mt-4 text-center text-sm text-error">{error}</p>
				{/each}
			{/if}

			<div class="mt-4 flex flex-col gap-2">
				<div>
					<label for="account-email" class="label">Current email</label>
					<input
						id="account-email"
						type="email"
						autocomplete="email"
						class="input mt-2 w-full text-base-content/60"
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
						class={['input mt-2 w-full', { 'input-error': $emailErrors.email }]}
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
	<h2 class="mt-2 text-lg font-semibold">Authentication</h2>

	<p class="mt-2">
		Sensitive operations require step up/re-authentication if a passkey is registered against the
		account. If the user has not recently authenticated using their passkey we prompt them to
		authenticate again during the save.
	</p>

	<h2 class="mt-2 text-lg font-semibold">Changing the email address</h2>

	<p class="mt-2">
		Changing the <span class="font-mono font-semibold">email</span>
		will first result in a verification code being sent to the new address. When the code is entered we:
	</p>

	<ol class="mt-2 ml-2 list-inside list-decimal space-y-2">
		<li>Update the local account</li>
		<li>Update any associated passkeys in the Passlock vault</li>
		<li>Update the passkeys in the user's local passkey manager</li>
		<li>
			Send a notification email to the <span class="font-semibold">old address</span>
			informing the user of the change
		</li>
	</ol>

	<h2 class="mt-2 text-lg font-semibold">Changing a name</h2>

	<p class="mt-2">
		Changing the <span class="font-mono font-semibold">name</span>
		will also change the display name for any passkeys associated with the current account in the user's
		local passkey manager.
	</p>
</DevNotes>

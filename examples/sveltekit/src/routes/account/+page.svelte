<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import ChallengeRateLimitNotice from '$lib/components/ChallengeRateLimitNotice.svelte';
	import { clearAccountQueryState } from '$lib/shared/queryState.js';
	import { EmailSchema, ProfileSchema } from '$lib/shared/schemas.js';
	import { updateUserPasskeys } from '$lib/client/passkeys';
	import { reAuthenticateIfNecessary } from './utils.js';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import EmailInput from '$lib/components/EmailInput.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import type { PageProps } from './$types';
	import { replaceState } from '$app/navigation';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { clearFormErrors, setFormError } from '$lib/client/forms.js';

	let { data }: PageProps = $props();

	let syncingUpdatedEmailPasskeys = $state(false);
	let rateLimitActive = $state(false);

	/**
	 * Once the redirect-driven status has been rendered, clear the transient
	 * query params so a refresh does not replay the same UI state.
	 */
	const clearQueryState = () => {
		const url = new URL(window.location.href);
		const search = new URL(clearAccountQueryState(url), window.location.origin).search;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(`${resolve('/account')}${search}`, {});
	};

	/**
	 * Refresh the passkeys stored on the current device so the browser's
	 * password manager shows the same account details as the server.
	 */
	const syncPasskeys = async () => {
		syncingUpdatedEmailPasskeys = true;
		clearFormErrors(accountEmailErrors);

		const result = await updateUserPasskeys({
			username: data.currentEmail,
			givenName: data.user?.givenName,
			familyName: data.user?.familyName
		});

		if (result._tag === '@error/UpdatePasskeyError') {
			setFormError(
				accountEmailErrors,
				'Email address updated, but local passkeys could not be refreshed automatically.'
			);
			syncingUpdatedEmailPasskeys = false;
			clearQueryState();
			return;
		}

		accountEmailMessage.set({
			type: 'success',
			text: 'Email address updated and passkeys refreshed.'
		});
		syncingUpdatedEmailPasskeys = false;
		clearQueryState();
	};

	onMount(() => {
		// Email verification finishes on a different route, then redirects back
		// here with query state that tells us whether local passkey metadata now
		// needs to be refreshed.
		if (data.syncPasskeysOnLoad) {
			void syncPasskeys();
			return;
		}

		if (data.clearQueryStateOnLoad) {
			clearQueryState();
			return;
		}
	});

	/**
	 * When the user submits the profile form (first and last name) we:
	 *
	 * 1. Check if they authenticated within the last N mins
	 * 2. If not, kick off passkey-based re-authentication
	 * 3. Submit the form and update the server-side records
	 * 4. Refresh the passkey display name on the user's local device
	 *
	 */
	// svelte-ignore state_referenced_locally
	const profileSuperform = superForm(data.profileForm, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(ProfileSchema),
		onSubmit: async ({ cancel }) => {
			const config = {
				tenancyId: data.tenancyId,
				rpId: data.rpId,
				endpoint: data.endpoint
			};

			const authResult = await reAuthenticateIfNecessary(
				{
					errors: profileErrors,
					validateForm: () => validateProfileForm({ update: true })
				},
				config
			);

			// something went wrong, abort
			if (authResult._tag === '@error/ReAuthenticationFailure') {
				cancel();
			}
		},
		onUpdated: async ({ form }) => {
			clearFormErrors(profileErrors);

			if (!data.hasPasskeys || !form.valid || !form.message) {
				return;
			}

			// Once the server update succeeds, ask the browser to refresh the
			// locally stored display name as well.
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

	const {
		errors: profileErrors,
		message: profileMessage,
		enhance: profileEnhance,
		delayed: profileDelayed,
		validateForm: validateProfileForm
	} = profileSuperform;

	/**
	 * When the user changes their email we:
	 *
	 * 1. Check if they authenticated within the last N mins
	 * 2. If not, kick off passkey-based re-authentication
	 * 3. Submit the form so the server can start the email verification flow
	 *
	 * This sends a verification email to the replacement address and redirects
	 * the user to `/account/verify-email`.
	 *
	 * Note: the local account email does not change until the code is verified.
	 *
	 */
	// svelte-ignore state_referenced_locally
	const accountEmailSuperform = superForm(data.accountEmailForm, {
		applyAction: true,
		invalidateAll: 'pessimistic',
		validators: valibotClient(EmailSchema),
		onSubmit: async ({ cancel }) => {
			const config = {
				tenancyId: data.tenancyId,
				rpId: data.rpId,
				endpoint: data.endpoint
			};

			const authResult = await reAuthenticateIfNecessary(
				{
					errors: accountEmailErrors,
					validateForm: () => validateAccountEmailForm({ update: true })
				},
				config
			);

			if (authResult._tag === '@error/ReAuthenticationFailure') {
				cancel();
			}
		}
	});

	const {
		errors: accountEmailErrors,
		message: accountEmailMessage,
		delayed: accountEmailDelayed,
		enhance: accountEmailEnhance,
		validateForm: validateAccountEmailForm
	} = accountEmailSuperform;
</script>

<svelte:head>
	<title>My Account</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center gap-4 px-4 py-8">
	<fieldset class="mt-4 fieldset max-w-md rounded-lg bg-base-200 p-10 pt-8">
		<form method="post" action="?/profile" use:profileEnhance>
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
					<TextInput
						superform={profileSuperform}
						field="givenName"
						label="First name"
						autocomplete="given-name"
						class="mt-2 w-full" />
				</div>

				<div>
					<TextInput
						superform={profileSuperform}
						field="familyName"
						label="Last name"
						autocomplete="family-name"
						class="mt-2 w-full" />
				</div>
			</div>

			<SubmitButton class="w-full" loading={$profileDelayed}>Save name changes</SubmitButton>
		</form>

		<div class="divider"></div>

		<form method="post" action="?/email" use:accountEmailEnhance>
			<h3 class="text-center text-xl font-semibold">Change email address</h3>
			<p class="mt-3 text-center text-sm text-base-content/80">
				We’ll send a verification code to your new email before updating your account.
			</p>

			{#if syncingUpdatedEmailPasskeys}
				<p class="mt-4 text-center text-sm text-base-content/80">Refreshing your passkeys...</p>
			{:else if $accountEmailMessage?.type === 'success'}
				<p class="mt-4 text-center text-sm text-success">{$accountEmailMessage.text}</p>
			{:else if $accountEmailMessage?.type === 'rateLimited'}
				<ChallengeRateLimitNotice
					rateLimit={$accountEmailMessage.rateLimit}
					onActiveChange={(isActive) => {
						rateLimitActive = isActive;
					}}
					class="mt-4 text-center text-sm" />
			{/if}

			{#if $accountEmailErrors._errors}
				{#each $accountEmailErrors._errors as error (error)}
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
					<EmailInput
						superform={accountEmailSuperform}
						field="email"
						label="New email"
						autocomplete="email"
						class="mt-2 w-full" />
				</div>
			</div>

			<SubmitButton class="w-full" disabled={rateLimitActive} loading={$accountEmailDelayed}>
				Verify new email
			</SubmitButton>
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

	<h2 class="mt-2 text-lg font-semibold">Changing the email</h2>

	<p class="mt-2">
		Changing the email will first result in a verification code being sent to the new address. When
		the code is entered we:
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
		Changing the first or last names will also change the display name for any passkeys associated
		with the current account in the user's local passkey manager.
	</p>
</DevNotes>

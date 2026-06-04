<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authenticatePasskey, preparePasskeyAuthentication } from '$lib/client/passkeys';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import type { PageProps } from './$types';
	import Link from '$lib/components/Link.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';

	let { data }: PageProps = $props();

	let loading = $state(false);
	let error = $state('');

	const login = async () => {
		error = '';
		loading = true;

		const config = { tenancyId: data.tenancyId, rpId: data.rpId, endpoint: data.endpoint };

		const preparedAuthentication = data.username
			? await preparePasskeyAuthentication({
					url: resolve('/login/passkey/prepare'),
					body: { username: data.username }
				})
			: undefined;

		if (preparedAuthentication?._tag === '@error/PreparePasskeyAuthenticationError') {
			error = preparedAuthentication.message;
			loading = false;
			return;
		}

		// The browser prompt happens here; the server verifies the returned code
		// and creates the local session. Known-user login uses a prepared token;
		// direct passkey login stays browser-started because no account is known.
		const result = await authenticatePasskey(
			preparedAuthentication
				? { authenticationToken: preparedAuthentication.authenticationToken }
				: {},
			config
		);

		if (result._tag == 'PasslockLoginSuccess') {
			loading = false;
			await invalidateAll();
			await goto(resolve('/'));
		} else {
			error = result.message;
			loading = false;
		}
	};
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login using your passkey</h2>
		<p class="mt-3 w-xs text-center text-sm text-base-content/80">
			Use your device passkey to sign in without waiting for an email code.
		</p>

		<SubmitButton {loading} disabled={loading} class="w-full" onclick={login}>
			Login using your passkey
		</SubmitButton>

		{#if error}
			<p class="mt-4 text-sm text-error">{error}</p>
		{/if}

		<div class="mt-4 text-center text-sm">
			Need email login instead?
			{#if data.username}
				<form method="get" action={resolve('/login/email')} class="inline">
					<input type="hidden" name="username" value={data.username} />
					<button type="submit" class="ml-1 cursor-pointer text-primary hover:underline">
						Use an emailed code
					</button>
				</form>
			{:else}
				<Link href={resolve('/login')} class="ml-1">Use an emailed code</Link>
			{/if}
		</div>
	</div>
</div>

{#if data.username}
	<DevNotes>
		<p>
			We know which account the user wants to authenticate against, so the server prepares the
			passkey authentication and sends the browser only a one-time authentication token.
		</p>

		<p class="mt-2">
			That keeps account-specific passkey policy on the backend while still letting the browser run
			the WebAuthn ceremony.
		</p>

		<p class="mt-2">
			For example, when they register an account and passkey using their personal laptop, then want
			to login using their work machine.
		</p>

		<p class="mt-2">
			We'll ask them to present a passkey that doesn't exist on the work machine. They'll drop into
			the roaming authenticator flow and most likely be prompted to scan a QR code using their
			personal smartphone.
		</p>
	</DevNotes>
{:else}
	<DevNotes>
		<p class="mt-2">
			We don't know which account the user wants to authenticate against until they present a
			passkey. They are free to present any suitable passkey.
		</p>
	</DevNotes>
{/if}

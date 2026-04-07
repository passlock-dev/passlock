<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authenticatePasskey } from '$lib/client/passkeys';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loading = $state(false);
	let error = $state('');

	const login = async () => {
		error = '';
		loading = true;

		// The browser prompt happens here; the server verifies the returned code
		// and creates the local session.
		const result = await authenticatePasskey({
			tenancyId: data.tenancyId,
			endpoint: data.endpoint,
			allowCredentials: data.allowCredentials
		});

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

		<button type="button" class="btn mt-6 w-full btn-primary" onclick={login} disabled={loading}>
			{#if loading}Logging in...{:else}Login using your passkey{/if}
		</button>

		{#if error}
			<p class="mt-4 text-sm text-error">{error}</p>
		{/if}

		<div class="mt-4 text-center text-sm">
			Need email login instead?
			{#if data.username}
				<form method="GET" action={resolve('/login/email')} class="inline">
					<input type="hidden" name="username" value={data.username} />
					<button type="submit" class="ml-1 cursor-pointer text-primary hover:underline">
						Use an emailed code
					</button>
				</form>
			{:else}
				<a class="ml-1 text-primary hover:underline" href={resolve('/login')}>
					Use an emailed code
				</a>
			{/if}
		</div>
	</div>
</div>

{#if data.allowCredentials.length > 0}
	<DevNotes>
		<p>
			We know which account the user wants to authenticate against, so we tell the browser to use
			passkeys linked to that account.
		</p>

		<p class="mt-2">
			In most cases this doesn't add any real value, but it's useful when a user might have multiple
			accounts.
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

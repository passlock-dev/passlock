<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { passlockLogin } from '$lib/client/passkeys';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loading = $state(false);
	let error = $state('');

	const loginWithPasskey = async () => {
		error = '';
		loading = true;

		const result = await passlockLogin(data);

		if (result._tag === '@error/PasslockLoginError') {
			error = result.message;
			loading = false;
			return;
		}

		loading = false;
		await invalidateAll();
		await goto(resolve('/'));
	};
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Login using your passkey</h2>
		<p class="mt-3 w-xs text-center text-sm text-base-content/80">
			Use your device passkey to sign in without typing your password.
		</p>

		<button
			type="button"
			class="btn mt-6 w-full btn-primary"
			onclick={loginWithPasskey}
			disabled={loading}>
			{#if loading}Logging in...{:else}Login using your passkey{/if}
		</button>

		{#if error}
			<p class="mt-4 text-sm text-error">{error}</p>
		{/if}

		<p class="mt-4 text-center text-sm">
			Need password login?
			{#if data.username}
				<a
					class="ml-1 text-primary hover:underline"
					href="{resolve('/login/password')}?username={encodeURIComponent(data.username)}">
					Use email and password
				</a>
			{:else}
				<a class="ml-1 text-primary hover:underline" href={resolve('/login')}>
					Use email and password
				</a>
			{/if}
		</p>
	</div>
</div>

<!-- TODO Delete me -->
{#if data.allowCredentials.length > 0}
	<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
		<h2 class="text-center text-xl font-semibold">Developer notes</h2>
		<p class="mt-2">
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
	</div>
{:else}
	<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
		<h2 class="text-center text-xl font-semibold">Developer notes</h2>
		<p class="mt-2">
			We don't know which account the user wants to authenticate against until they present a
			passkey. They are free to present any suitable passkey.
		</p>
	</div>
{/if}

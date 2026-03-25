<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authenticatePasskey } from '$lib/client/passkeys';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loading = $state(false);
	let error = $state('');

	const reauthenticate = async () => {
		error = '';
		loading = true;
		const returnTo = data.returnTo ?? '/account';

		const result = await authenticatePasskey({
			...data,
      userVerification: "required",
			verificationRoute: '/account/re-authenticate'
		});

		if (result._tag === 'PasslockLoginSuccess') {
			loading = false;
			await goto(returnTo);
			return;
		}

		error = result.message;
		loading = false;
	};
</script>

<svelte:head>
	<title>Confirm Your Passkey</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<div class="rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Confirm it’s you</h2>
		<p class="mt-3 w-xs text-center text-sm text-base-content/80">
			Use your passkey to unlock account management for the next 10 minutes.
		</p>

		<button
			type="button"
			class="btn mt-6 w-full btn-primary"
			onclick={reauthenticate}
			disabled={loading}>
			{#if loading}Checking...{:else}Use your passkey{/if}
		</button>

		{#if error}
			<p class="mt-4 text-sm text-error">{error}</p>
		{/if}

		<p class="mt-4 text-center text-sm">
			<a class="text-primary hover:underline" href={resolve('/')}>Back home</a>
		</p>
	</div>
</div>

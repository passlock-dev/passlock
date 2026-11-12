<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { PasslockClientConfig } from '#lib/client/passkeys.js';
	import AccountReauthentication from './AccountReauthentication.svelte';

	let {
		config,
		pageName,
		children
	}: {
		config: PasslockClientConfig;
		pageName: string;
		children: Snippet;
	} = $props();
	let reauthentication: AccountReauthentication;
	let unlocked = $state(false);
	let checking = $state(false);
	let error = $state('');

	/** Each page visit rechecks the shared account policy before showing its controls. */
	const unlock = async () => {
		checking = true;
		error = '';
		try {
			unlocked = await reauthentication.confirm();
			if (!unlocked)
				error = 'Confirm your identity to continue. If your session expired, sign in again.';
		} finally {
			checking = false;
		}
	};
	onMount(() => {
		void unlock();
	});
</script>

<AccountReauthentication bind:this={reauthentication} {config} />

{#if unlocked}
	{@render children()}
{:else}
	<div class="flex h-full w-full flex-col items-center justify-center px-4 py-8">
		<div class="max-w-md rounded-lg bg-base-200 p-10 text-center">
			<h2 class="text-xl font-semibold">Confirm your identity</h2>
			<p class="mt-3 text-sm">Recent authentication is required to view {pageName}.</p>
			{#if error}<p class="mt-4 text-sm text-error" role="alert">{error}</p>{/if}
			<button class="btn mt-4 btn-primary" disabled={checking} onclick={unlock}>
				{checking ? 'Checking authentication…' : 'Continue'}
			</button>
		</div>
	</div>
{/if}

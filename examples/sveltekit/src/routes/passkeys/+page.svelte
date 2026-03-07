<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { createPasslockPasskey, deletePasslockPasskey } from '$lib/client/passlock';
	import { KeyRound, Trash2 } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let passkeys = $derived(data.existingPasskeys);
	let existingPasskeys = $derived(data.existingPasskeys.map(({ passkeyId }) => passkeyId));

	let loading = $state(false);
	let deletingPasskeyId = $state<string | null>(null);
	let info = $state('');
	let warning = $state('');
	let error = $state('');

	const createPasskey = async () => {
		info = '';
		warning = '';
		error = '';
		loading = true;

		const result = await createPasslockPasskey({
			tenancyId: data.tenancyId,
			endpoint: data.endpoint,
			email: data.user.email,
			existingPasskeys
		});

		if (result._tag === '@error/CreatePasskeyError') {
			error = result.message;
			loading = false;
			return;
		}

		info = 'Passkey created and linked to your account.';
		loading = false;
		await invalidate('passkeys');
	};

	const deletePasskey = async (passkeyId: string) => {
		const { tenancyId, endpoint } = data;

		info = '';
		warning = '';
		error = '';
		deletingPasskeyId = passkeyId;

		deletingPasskeyId = passkeyId;
		const result = await deletePasslockPasskey({ tenancyId, endpoint, passkeyId });

		if (result._tag === '@error/DeletePasskeyError') {
			error = result.message;
			deletingPasskeyId = null;
			return;
		} else if (result._tag === '@warning/PasskeyDeletePaused') {
			deletingPasskeyId = null;
			error = result.message;
			return;
		}

		if (result.warning) {
			warning = result.warning;
		} else {
			info = 'Passkey deleted from your account';
		}

		deletingPasskeyId = null;
		passkeys = passkeys.filter((passkey) => passkey.passkeyId !== passkeyId);
	};
</script>

<svelte:head>
  <title>My Passkeys</title>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center">
	<div class="flex w-full max-w-sm flex-col gap-2">
		<div class="rounded-lg bg-base-200 p-10 pt-8">
			<h2 class="text-center text-xl font-semibold">Create a passkey</h2>
			<p class="mt-3 w-xs text-center text-sm text-base-content/80">
				Create a passkey to sign in faster and without entering a password.
			</p>

			<button
				type="button"
				class="btn mt-6 w-full btn-primary"
				onclick={createPasskey}
				disabled={loading || deletingPasskeyId !== null}>
				{#if loading}Creating...{:else}Create a passkey{/if}
			</button>

			{#if info}
				<p class="mt-4 text-sm text-success">{info}</p>
			{/if}

			{#if warning}
				<p class="mt-4 text-sm text-warning">{info}</p>
			{/if}

			{#if error}
				<p class="mt-4 text-sm text-error">{error}</p>
			{/if}
		</div>

		<ul class="list rounded-box bg-base-200 shadow-md">
			<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Your passkeys</li>

			{#if passkeys.length === 0}
				<li class="list-row">
					<div class="text-sm opacity-70">No passkeys yet.</div>
				</li>
			{:else}
				{#each passkeys as passkey (passkey.passkeyId)}
					<li class="list-row">
						<div>
							{#if passkey.platformIcon}
								<img class="size-10 rounded-box" src={passkey.platformIcon} alt="" />
							{:else}
								<KeyRound class="size-10 rounded-box" />
							{/if}
						</div>
						<div>
							<div class="font-mono text-sm">{passkey.username ?? passkey.passkeyId}</div>
							<div class="mt-1 text-xs font-semibold uppercase opacity-60">
								{passkey.platformName ?? 'Unknown Platform'}
							</div>
						</div>
						<button
							type="button"
							class="btn btn-square btn-ghost"
							aria-label="Delete passkey"
							disabled={loading || deletingPasskeyId === passkey.passkeyId}
							onclick={() => deletePasskey(passkey.passkeyId)}>
							{#if deletingPasskeyId === passkey.passkeyId}
								<span class="loading loading-xs loading-spinner"></span>
							{:else}
								<Trash2 />
							{/if}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	</div>
</div>

<!-- TODO Delete me -->
<div class="absolute top-20 right-8 hidden w-96 bg-base-200 p-8 lg:block">
	<h2 class="text-center text-xl font-semibold">Developer notes</h2>
	<p class="mt-2">
		As passkeys are typically synced across platforms/ecosystems, it's useful to show users which
		platform a passkey belongs to.
	</p>

	<p class="mt-2">
		Most users will need only one passkey but if they use more than one platform e.g. Apple +
		MS/Google they'd need one passkey per platform.
	</p>

	<p class="mt-2">
		When a user deletes a passkey (or closes their account), you need to also delete the passkey
		from their local device/passkey manager otherwise they'd end up with an orphaned passkey.
	</p>

	<p class="mt-2">This sample app handles these scenarios for you 👍</p>
</div>

<script lang="ts">
	import ReauthenticationGate from '#lib/components/ReauthenticationGate.svelte';
	import { onMount } from 'svelte';
	import { Smartphone, Trash2 } from '@lucide/svelte';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { requestTotp, confirmTotpAccess } from '#lib/client/totp.js';
	import type { TotpEnrollment, TotpResponse } from '#lib/shared/totp.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let setup = $state<TotpEnrollment | null>(null);
	let displayName = $state('My authenticator');
	let code = $state('');
	let busy = $state(false);
	let message = $state('');
	let retryAt = $state(0);
	let now = $state(Date.now());
	const retrySeconds = $derived(Math.max(0, Math.ceil((retryAt - now) / 1000)));
	const clearSetup = () => {
		setup = null;
		code = '';
	};
	onMount(() => {
		const timer = setInterval(() => {
			now = Date.now();
			if (setup && now >= setup.expiresAt) {
				clearSetup();
				message = 'Enrollment expired. Remove the pending enrollment and start again.';
			}
		}, 1000);
		window.addEventListener('pagehide', clearSetup);
		return () => {
			clearInterval(timer);
			window.removeEventListener('pagehide', clearSetup);
			clearSetup();
		};
	});

	const applyResult = (result: TotpResponse, successMessage: string) => {
		if (result.type === 'error') {
			message = result.message;
			if (result.retryAfterSeconds) retryAt = Date.now() + result.retryAfterSeconds * 1000;
		} else message = successMessage;
	};
	const act = async (run: () => Promise<void>) => {
		busy = true;
		message = '';
		try {
			const denied = await confirmTotpAccess(data);
			if (denied) {
				message = denied;
				return;
			}
			await run();
			await invalidate('account:totp');
		} finally {
			busy = false;
		}
	};
	const enroll = () =>
		act(async () => {
			clearSetup();
			const result = await requestTotp(resolve('account/totp/enroll'), { displayName });
			if (result.type === 'enrollment') setup = result;
			else applyResult(result, 'Enrollment started.');
		});
	const confirm = () => {
		if (!setup) return;
		const authenticatorId = setup.authenticatorId;
		const submitted = code;
		code = '';
		return act(async () => {
			const result = await requestTotp(resolve('account/totp/confirm'), {
				authenticatorId,
				code: submitted
			});
			if (result.type === 'success') clearSetup();
			applyResult(
				result,
				'Authenticator confirmed. Email sign-in now requires an authenticator code. Wait for a new code before using it to sign in.'
			);
		});
	};
	const remove = (authenticatorId: string) => {
		if (
			!window.confirm(
				'Remove this authenticator? Removing the last one turns off the second step for email sign-in.'
			)
		)
			return;
		// Dismiss provisioning material immediately, even if remote removal is unavailable.
		if (setup?.authenticatorId === authenticatorId) clearSetup();
		return act(async () => {
			const result = await requestTotp(resolve('account/totp/remove'), { authenticatorId });
			applyResult(result, 'Authenticator removed.');
		});
	};
	const reconcile = (authenticatorId: string) =>
		act(async () => {
			const result = await requestTotp(resolve('account/totp/reconcile'), { authenticatorId });
			if (result.type === 'success') clearSetup();
			applyResult(
				result,
				'Enrollment confirmed. Email sign-in now requires an authenticator code.'
			);
		});
</script>

<svelte:head>
	<title>My Authenticators</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<ReauthenticationGate config={data} pageName="your authenticators">
	<section class="flex h-full w-full flex-col items-center justify-center">
		<div class="flex w-full max-w-sm flex-col gap-2">
			<div class="rounded-lg bg-base-200 p-10 pt-8">
				<h2 class="text-center text-xl font-semibold">Register an authenticator</h2>
				<p class="mt-3 text-center text-sm text-base-content/80">
					After confirmation, email sign-in needs a code from an authenticator app
				</p>

				{#if setup}
					<div class="mt-6">
						<h3 class="text-lg font-semibold">Set up your authenticator</h3>
						<p class="mt-3 text-sm text-base-content/80">
							Scan this QR code in your authenticator app, or enter the setup key manually.
						</p>
						<img
							class="mx-auto my-4 max-w-full"
							src={setup.setup.qrCodeDataUrl}
							alt="Scan this QR code with your authenticator app"
							width="256"
							height="256" />
						<p class="text-sm">Manual setup key (keep it secret):</p>
						<code
							class="mt-2 block rounded bg-base-100 p-3 break-all"
							aria-label="Manual authenticator setup key">
							{setup.setup.secret}
						</code>
						<p class="mt-3 text-sm">
							SHA1 · {setup.digits} digits · 30 seconds. Confirm within {Math.max(
								0,
								Math.ceil((setup.expiresAt - now) / 1000)
							)} seconds. Setup cannot be recovered after leaving this page.
						</p>
						<form
							class="mt-4 flex flex-col gap-3"
							onsubmit={(event) => {
								event.preventDefault();
								void confirm();
							}}>
							<label for="enrollment-code">Code from your authenticator</label>
							<input
								id="enrollment-code"
								class="input w-full"
								type="text"
								inputmode="numeric"
								autocomplete="one-time-code"
								pattern={`[0-9]{${setup.digits}}`}
								maxlength={setup.digits}
								minlength={setup.digits}
								bind:value={code}
								required
								disabled={busy || retrySeconds > 0} />
							<SubmitButton loading={busy} disabled={busy || retrySeconds > 0}>
								Confirm authenticator
							</SubmitButton>
							<button
								class="btn btn-ghost"
								type="button"
								disabled={busy}
								onclick={() => setup && remove(setup.authenticatorId)}>
								Cancel enrollment
							</button>
						</form>
					</div>
				{:else}
					<form
						class="mt-6"
						onsubmit={(event) => {
							event.preventDefault();
							void enroll();
						}}>
						<label class="text-sm" for="authenticator-name">Name for this authenticator</label>
						<input
							id="authenticator-name"
							class="input mt-2 w-full"
							type="text"
							bind:value={displayName}
							maxlength="120"
							required
							disabled={busy} />
						<SubmitButton class="mt-6 w-full" loading={busy} disabled={busy || retrySeconds > 0}>
							Register an authenticator
						</SubmitButton>
					</form>
				{/if}

				{#if message}
					<p class="mt-4 text-sm" role="status" aria-live="polite">{message}</p>
				{/if}
				{#if retrySeconds > 0}
					<p class="mt-4 text-sm" role="status">
						Try again in {retrySeconds} seconds using a fresh code.
					</p>
				{/if}

				<p class="mt-3 text-sm opacity-60">
					Adding a replacement authenticator never removes the old one.
				</p>
			</div>

			<ul class="list rounded-box bg-base-200 shadow-md">
				<li class="p-4 pb-2 text-xs tracking-wide opacity-60">My authenticators</li>

				{#each data.credentials as credential (credential.id)}
					<li class="list-row grid-cols-[auto_minmax(0,1fr)_auto]">
						<div><Smartphone class="size-10 rounded-box" /></div>
						<div class="min-w-0">
							<div class="font-mono text-sm break-words">{credential.displayName}</div>
							<div class="mt-1 text-xs font-semibold uppercase opacity-60">
								{credential.status === 'active'
									? 'Confirmed — required for email sign-in'
									: credential.status === 'confirming'
										? 'Confirmation needs a status check'
										: 'Pending — not enabled'}
							</div>
						</div>
						<button
							type="button"
							class="btn btn-square btn-ghost"
							aria-label={`Remove authenticator ${credential.displayName}`}
							disabled={busy}
							onclick={() => remove(credential.id)}>
							<Trash2 />
						</button>
						{#if credential.status === 'pending' && setup?.authenticatorId !== credential.id}
							<p class="col-span-full row-start-2 text-sm">
								Setup is no longer available. Remove this enrollment and start again.
							</p>
						{/if}
						{#if credential.status === 'confirming'}
							<div class="col-span-full row-start-2">
								<button class="btn btn-sm" disabled={busy} onclick={() => reconcile(credential.id)}>
									Check enrollment status
								</button>
							</div>
						{/if}
					</li>
				{:else}
					<li class="list-row">
						<div class="text-sm opacity-70">No authenticators enrolled yet.</div>
					</li>
				{/each}
			</ul>
		</div>
	</section>
</ReauthenticationGate>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import * as v from 'valibot';
	import {
		authenticatePasskey,
		authorizePasskeyAuthentication,
		type PasslockClientConfig
	} from '#lib/client/passkeys.js';
	import { requestTotp } from '#lib/client/totp.js';
	import SubmitButton from './SubmitButton.svelte';

	let { config }: { config: PasslockClientConfig } = $props();
	let dialog: HTMLDialogElement;
	let credentials = $state<{ id: string; displayName: string; digits: number }[]>([]);
	let selected = $state('');
	let code = $state('');
	let busy = $state(false);
	let orphanMessage = $state('');
	let message = $state('');
	let retryAt = $state(0);
	let now = $state(Date.now());
	let credential = $derived(credentials.find((item) => item.id === selected));
	let retrySeconds = $derived(Math.max(0, Math.ceil((retryAt - now) / 1000)));
	let finish: ((success: boolean) => void) | undefined;

	const statusSchema = v.object({
		required: v.boolean(),
		method: v.nullable(v.picklist(['passkey', 'totp'])),
		credentials: v.array(v.object({ id: v.string(), displayName: v.string(), digits: v.number() }))
	});

	/** Recheck server policy every time; TOTP never substitutes for a registered passkey. */
	let inFlight: Promise<boolean> | undefined;
	export function confirm(intent?: 'delete-account'): Promise<boolean> {
		// Concurrent form submissions share one prompt and cannot replace its resolver.
		inFlight ??= confirmOnce(intent).finally(() => {
			inFlight = undefined;
		});
		return inFlight;
	}
	async function confirmOnce(intent?: 'delete-account'): Promise<boolean> {
		message = '';
		orphanMessage = '';
		try {
			const route = resolve('account/re-authenticate');
			const response = await fetch(intent ? `${route}?intent=${intent}` : route, {
				cache: 'no-store',
				redirect: 'error'
			});
			if (!response.ok) return false;
			const status = v.parse(statusSchema, await response.json());
			if (!status.required) return true;
			if (status.method === 'passkey') {
				const authorization = await authorizePasskeyAuthentication({
					url: resolve('account/re-authenticate/authorize')
				});
				if (authorization._tag === '@error/AuthorizePasskeyAuthenticationError') return false;
				const result = await authenticatePasskey(
					{
						authenticationToken: authorization.authenticationToken,
						verificationRoute: resolve('account/re-authenticate')
					},
					config
				);
				if (result._tag === '@error/OrphanedPasskey') orphanMessage = result.message;
				return result._tag === 'PasslockLoginSuccess';
			}
			if (status.method !== 'totp') return false;
			credentials = status.credentials;
			selected = credentials[0]?.id ?? '';
			code = '';
			dialog.showModal();
			return await new Promise<boolean>((resolve) => {
				finish = resolve;
			});
		} catch {
			return false;
		}
	}
	const close = (success: boolean) => {
		code = '';
		dialog.close();
		finish?.(success);
		finish = undefined;
	};
	const verify = async () => {
		if (busy || retrySeconds > 0) return;
		busy = true;
		const submitted = code;
		code = '';
		try {
			const result = await requestTotp(resolve('account/totp/re-authenticate'), {
				authenticatorId: selected,
				code: submitted
			});
			if (result.type === 'success') close(true);
			else if (result.type === 'error') {
				message = result.message;
				if (result.retryAfterSeconds) retryAt = Date.now() + result.retryAfterSeconds * 1000;
			}
		} finally {
			busy = false;
		}
	};
	onMount(() => {
		const timer = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(timer);
	});
	onDestroy(() => finish?.(false));
</script>

{#if orphanMessage}<p role="alert" class="text-sm text-error">{orphanMessage}</p>{/if}

<dialog
	bind:this={dialog}
	class="modal"
	oncancel={(event) => {
		event.preventDefault();
		if (!busy) close(false);
	}}
	aria-labelledby="reauth-title">
	<div class="modal-box">
		<h2 id="reauth-title" class="text-xl font-semibold">Confirm your identity</h2>
		<p class="mt-3 text-sm">Enter a fresh code from your authenticator to continue.</p>
		{#if credentials.length === 0}
			<p class="mt-4 text-sm text-error" role="alert">
				No confirmed authenticator is available. Check enrollment status on the My Authenticators
				page.
			</p>
		{/if}
		<form
			class="mt-4"
			onsubmit={(event) => {
				event.preventDefault();
				void verify();
			}}>
			<label for="reauth-authenticator" class="label">Authenticator</label>
			<select id="reauth-authenticator" class="select w-full" bind:value={selected} disabled={busy}>
				{#each credentials as item (item.id)}<option value={item.id}>
						{item.displayName}
					</option>{/each}
			</select>
			<label for="reauth-code" class="label mt-4">{credential?.digits ?? 6}-digit code</label>
			<input
				id="reauth-code"
				class="input w-full"
				type="text"
				inputmode="numeric"
				autocomplete="one-time-code"
				pattern={`[0-9]{${credential?.digits ?? 6}}`}
				minlength={credential?.digits ?? 6}
				maxlength={credential?.digits ?? 6}
				required
				bind:value={code}
				disabled={busy || retrySeconds > 0} />
			{#if message}<p class="mt-4 text-sm text-error" role="alert">{message}</p>{/if}
			{#if retrySeconds > 0}<p class="mt-4 text-sm" role="status">
					Wait {retrySeconds} seconds, then enter a fresh code.
				</p>{/if}
			<div class="modal-action">
				<button type="button" class="btn" disabled={busy} onclick={() => close(false)}>
					Cancel
				</button>
				<SubmitButton loading={busy} disabled={busy || retrySeconds > 0 || !credential}>
					Confirm
				</SubmitButton>
			</div>
		</form>
	</div>
</dialog>

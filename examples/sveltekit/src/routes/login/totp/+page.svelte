<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { requestTotp } from '#lib/client/totp.js';
	import SubmitButton from '#lib/components/SubmitButton.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	let selected = $state('');
	let code = $state('');
	let busy = $state(false);
	let message = $state('');
	let retryAt = $state(0);
	let now = $state(Date.now());
	let credential = $derived(data.credentials.find((item) => item.id === selected));
	let expired = $derived(now >= data.expiresAt);
	let retrySeconds = $derived(Math.max(0, Math.ceil((retryAt - now) / 1000)));
	$effect(() => {
		if (!data.credentials.some((item) => item.id === selected))
			selected = data.credentials[0]?.id ?? '';
	});
	onMount(() => {
		const timer = setInterval(() => {
			now = Date.now();
			if (now >= data.expiresAt) code = '';
		}, 1000);
		return () => clearInterval(timer);
	});
	const verify = async () => {
		const submitted = code;
		code = '';
		busy = true;
		message = '';
		try {
			const result = await requestTotp(resolve('login/totp/verify'), {
				authenticatorId: selected,
				code: submitted
			});
			if (result.type === 'loggedIn') {
				await invalidateAll();
				await goto(resolve('/'));
			} else if (result.type === 'error') {
				message = result.message;
				if (result.retryAfterSeconds) retryAt = Date.now() + result.retryAfterSeconds * 1000;
			}
		} finally {
			busy = false;
		}
	};
	const cancel = async () => {
		busy = true;
		code = '';
		const result = await requestTotp(resolve('login/totp/cancel'));
		if (result.type === 'success') await goto(resolve('login'));
		else if (result.type === 'error') message = result.message;
		busy = false;
	};
</script>

<svelte:head>
	<title>Verify your authenticator</title>
	<meta name="robots" content="noindex" />
</svelte:head>
<section class="flex h-full w-full flex-col items-center justify-center">
	<div class="flex w-full max-w-sm flex-col gap-2">
		<div class="rounded-lg bg-base-200 p-10 pt-8">
			<h1 class="text-center text-xl font-semibold">Enter your authenticator code</h1>
			<p class="mt-3 text-center text-sm text-base-content/80">
				Enter the 6 digit code from your authenticator to complete sign-in.
			</p>

			{#if expired}
				<p class="mt-4 text-sm text-error" role="alert">This login expired. Start again.</p>
			{:else}
				<p class="mt-3 text-center text-sm text-base-content/60">
					This login expires in {Math.max(0, Math.ceil((data.expiresAt - now) / 1000))} seconds.
				</p>
			{/if}
			{#if data.credentials.length === 0}
				<p class="mt-4 text-sm text-error" role="alert">
					No confirmed authenticator is available for this login. Check enrollment status from an
					existing signed-in session, or sign in with a passkey if you have one.
				</p>
			{/if}

			<form
				class="mt-6"
				onsubmit={(event) => {
					event.preventDefault();
					void verify();
				}}>
				<label class="text-sm" for="authenticator">Authenticator</label>
				<select
					id="authenticator"
					class="select mt-2 w-full"
					bind:value={selected}
					disabled={busy || expired}>
					{#each data.credentials as item (item.id)}
						<option value={item.id}>{item.displayName}</option>
					{/each}
				</select>
				<label class="mt-4 block text-sm" for="login-totp-code">
					{credential?.digits ?? 6}-digit code
				</label>
				<input
					id="login-totp-code"
					class="input mt-2 w-full"
					type="text"
					inputmode="numeric"
					autocomplete="one-time-code"
					pattern={`[0-9]{${credential?.digits ?? 6}}`}
					maxlength={credential?.digits ?? 6}
					minlength={credential?.digits ?? 6}
					bind:value={code}
					required
					disabled={busy || expired || retrySeconds > 0} />
				<SubmitButton
					class="mt-6 w-full"
					loading={busy}
					disabled={busy || expired || retrySeconds > 0 || !credential}>
					Sign in
				</SubmitButton>
			</form>

			{#if message}
				<p class="mt-4 text-sm text-error" role="alert">{message}</p>
			{/if}
			{#if retrySeconds > 0}
				<p class="mt-4 text-sm text-warning" role="status">
					Wait {retrySeconds} seconds, then enter a fresh code.
				</p>
			{/if}

			<div class="mt-4 text-center text-sm">
				<a class="link" href={resolve('login/passkey')}>Have a passkey? Sign in with it</a>
			</div>
			<button class="btn mt-3 w-full btn-ghost" disabled={busy} onclick={cancel}>
				Cancel and start again
			</button>
		</div>
	</div>
</section>

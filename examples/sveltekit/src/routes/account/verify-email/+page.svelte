<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import ChallengeRateLimitNotice from '$lib/components/ChallengeRateLimitNotice.svelte';
	import DevNotes from '$lib/components/DevNotes.svelte';
	import type { ChallengeRateLimitView } from '$lib/shared/challengeRateLimit.js';

	let { data, form: actionData }: PageProps = $props();
	type ResendRateLimit = ChallengeRateLimitView | null;

	const getActionResendRateLimit = (value: PageProps['form']): ResendRateLimit | undefined => {
		if (!value || typeof value !== 'object' || !('resendRateLimit' in value)) return undefined;
		return value.resendRateLimit as ResendRateLimit;
	};

	const getInitialResendRateLimit = (): ResendRateLimit => {
		const initialActionResendRateLimit = getActionResendRateLimit(actionData);
		return initialActionResendRateLimit === undefined
			? data.resendRateLimit
			: initialActionResendRateLimit;
	};

	const isResendRateLimitActive = (value: ResendRateLimit) =>
		Boolean(value && value.initialRemainingSeconds > 0);

	const initialResendRateLimit = getInitialResendRateLimit();
	let resendRateLimit = $state<ResendRateLimit>(initialResendRateLimit);
	let resendRateLimitActive = $state(isResendRateLimitActive(initialResendRateLimit));

	$effect(() => {
		const nextResendRateLimit = getActionResendRateLimit(actionData);
		if (nextResendRateLimit === undefined) return;

		resendRateLimit = nextResendRateLimit;
		resendRateLimitActive = isResendRateLimitActive(nextResendRateLimit);
	});

	// svelte-ignore state_referenced_locally
	const {
		form: verifyForm,
		errors: verifyErrors,
		enhance: verifyEnhance,
		constraints: verifyConstraints
	} = superForm(data.verifyForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});

	// svelte-ignore state_referenced_locally
	const {
		form: resendForm,
		errors: resendErrors,
		message: resendMessage,
		enhance: resendEnhance
	} = superForm(data.resendForm, {
		applyAction: true,
		invalidateAll: 'pessimistic'
	});
</script>

<svelte:head>
	<title>Verify New Email</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center px-4 py-8">
	<div class="w-full max-w-sm rounded-lg bg-base-200 p-10 pt-8">
		<h2 class="text-center text-xl font-semibold">Verify your new email</h2>
		<p class="mt-3 text-center text-sm text-base-content/80">
			We sent a 6-digit code to <span class="font-semibold">{data.email}</span>
			.
		</p>
		<p class="mt-2 text-center text-sm text-base-content/80">
			Your account email will only change after you enter this code.
		</p>

		<form method="POST" action="?/verify" use:verifyEnhance class="mt-6">
			<fieldset class="fieldset">
				<label for="code" class="label">One-time code</label>
				<input
					id="code"
					type="text"
					name="code"
					autocomplete="one-time-code"
					class={['input tracking-[0.3em]', { 'input-error': $verifyErrors.code }]}
					bind:value={$verifyForm.code}
					{...$verifyConstraints.code} />

				{#if $verifyErrors.code}
					{#each $verifyErrors.code as error (error)}
						<span class="text-error">{error}</span>
					{/each}
				{/if}

				<button class="btn mt-4 btn-primary">Verify email</button>
			</fieldset>
		</form>

		{#if resendRateLimit}
			<ChallengeRateLimitNotice
				onActiveChange={(active) => {
					resendRateLimitActive = active;
				}}
				rateLimit={resendRateLimit}
				className="mt-4 text-center text-sm" />
		{/if}

		{#if $resendErrors._errors}
			{#each $resendErrors._errors as error (error)}
				<p class="mt-4 text-center text-sm text-error">{error}</p>
			{/each}
		{/if}

		{#if $resendMessage}
			<p class="mt-4 text-center text-sm text-success">{$resendMessage}</p>
		{/if}

		<form method="POST" action="?/resend" use:resendEnhance class="mt-4">
			<input type="hidden" name="intent" bind:value={$resendForm.intent} />
			<button class="btn w-full btn-outline" disabled={resendRateLimitActive}>
				Send a new code
			</button>
		</form>

		<p class="mt-4 text-center text-sm">
			Need to start over?
			<a href={resolve('/account')} class="ml-1 text-primary hover:underline">Back to account</a>
		</p>
	</div>
</div>

<DevNotes>
	<p>This sample app doesn't actually send emails.</p>
	<p class="mt-2">You'll need to plug your own email sending mechanism into:</p>
	<p class="mt-2">
		<span class="font-mono">src/lib/server/email.ts</span>
	</p>
	<p class="mt-2">
		In the meantime <span class="font-semibold">check the dev server logs</span>
		where we have logged the code to the console.
	</p>
	<p class="mt-2 font-semibold text-error">Be sure to remove this before going into production!</p>
</DevNotes>

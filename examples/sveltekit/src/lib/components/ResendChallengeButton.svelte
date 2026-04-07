<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { resendChallenge } from '$lib/client/challenges.js';
	import { asResendRedirectLocation } from '$lib/shared/routes.js';
	import type { ChallengeRateLimitView } from '$lib/shared/challengeRateLimit.js';
	import ChallengeRateLimitNotice from './ChallengeRateLimitNotice.svelte';

	let {
		url,
		buttonLabel = 'Send a new code',
		loadingLabel = 'Sending...',
		initialRateLimit: providedInitialRateLimit = null
	}: {
		url: string;
		buttonLabel?: string;
		loadingLabel?: string;
		initialRateLimit?: ChallengeRateLimitView | null;
	} = $props();

	const isRateLimitActive = (value: ChallengeRateLimitView | null) =>
		Boolean(value && value.retryAfterSeconds > 0);

	// svelte-ignore state_referenced_locally
	const initialRateLimit = providedInitialRateLimit;

	let loading = $state(false);
	let message = $state('');
	let error = $state('');
	let rateLimit = $state<ChallengeRateLimitView | null>(initialRateLimit);
	let rateLimitActive = $state(isRateLimitActive(initialRateLimit));

	const handleClick = async () => {
		if (loading || rateLimitActive) return;

		loading = true;
		message = '';
		error = '';

		try {
			const result = await resendChallenge(url);

			if (result._tag === 'ResendChallengeRedirect') {
				await goto(resolve(asResendRedirectLocation(result.location)));
				return;
			}

			if (result._tag === 'ResendChallengeSuccess') {
				rateLimit = null;
				rateLimitActive = false;
				message = result.message;
				return;
			}

			if (result._tag === 'ResendChallengeRateLimited') {
				rateLimit = result.rateLimit;
				rateLimitActive = isRateLimitActive(result.rateLimit);
				return;
			}

			rateLimit = null;
			rateLimitActive = false;
			error = result.message;
		} finally {
			loading = false;
		}
	};
</script>

{#if rateLimit}
	<ChallengeRateLimitNotice
		onActiveChange={(active) => {
			rateLimitActive = active;
		}}
		{rateLimit}
		className="mt-4 text-center text-sm" />
{/if}

{#if error}
	<p class="mt-4 text-center text-sm text-error">{error}</p>
{/if}

{#if message}
	<p class="mt-4 text-center text-sm text-success">{message}</p>
{/if}

<button
	type="button"
	class="btn mt-4 w-full btn-outline"
	disabled={loading || rateLimitActive}
	onclick={handleClick}>
	{#if loading}
		{loadingLabel}
	{:else}
		{buttonLabel}
	{/if}
</button>

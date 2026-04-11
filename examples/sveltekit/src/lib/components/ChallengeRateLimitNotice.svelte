<script lang="ts">
	import { onMount } from 'svelte';
	import {
		formatChallengeRateLimitCountdown,
		type ChallengeRateLimitView
	} from '$lib/shared/challengeRateLimit.js';

	let {
		rateLimit,
		className = '',
		onActiveChange
	}: {
		rateLimit: ChallengeRateLimitView;
		className?: string;
		onActiveChange?: (active: boolean) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let remainingSeconds = $state(rateLimit.retryAfterSeconds);

	$effect(() => {
		onActiveChange?.(remainingSeconds > 0);
	});

	let message = $derived(
		remainingSeconds > 0
			? formatChallengeRateLimitCountdown(remainingSeconds)
			: rateLimit.readyMessage
	);

	let toneClass = $derived(remainingSeconds > 0 ? 'text-error' : 'text-success');

	onMount(() => {
		const targetMs = Date.now() + rateLimit.retryAfterSeconds * 1000;
		const updateRemainingSeconds = () => {
			remainingSeconds = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
		};

		updateRemainingSeconds();
		const intervalId = window.setInterval(updateRemainingSeconds, 1000);

		return () => window.clearInterval(intervalId);
	});
</script>

<p aria-live="polite" class={[className, toneClass]}>{message}</p>

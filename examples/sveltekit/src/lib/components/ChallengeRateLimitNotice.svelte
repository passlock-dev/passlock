<script lang="ts">
	import { onMount } from 'svelte';
	import {
		formatChallengeRateLimitCountdown,
		getChallengeRateLimitRemainingSeconds,
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

	let remainingSeconds = $derived(rateLimit.initialRemainingSeconds);

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
		const updateRemainingSeconds = () => {
			remainingSeconds = getChallengeRateLimitRemainingSeconds(rateLimit.retryAtMs);
		};

		updateRemainingSeconds();
		const intervalId = window.setInterval(updateRemainingSeconds, 1000);

		return () => window.clearInterval(intervalId);
	});
</script>

<p aria-live="polite" class={[className, toneClass]}>{message}</p>

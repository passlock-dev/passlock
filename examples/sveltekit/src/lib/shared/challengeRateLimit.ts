import * as v from 'valibot';

export const ChallengeRateLimitViewSchema = v.object({
	retryAtMs: v.pipe(v.number(), v.integer()),
	initialRemainingSeconds: v.pipe(v.number(), v.integer()),
	readyMessage: v.string()
});

export type ChallengeRateLimitView = v.InferOutput<typeof ChallengeRateLimitViewSchema>;

export const CHALLENGE_RATE_LIMIT_READY_MESSAGE = 'You can request a new code now.';

export const getChallengeRateLimitRemainingSeconds = (retryAtMs: number, now = Date.now()) =>
	Math.max(0, Math.ceil((retryAtMs - now) / 1000));

export const formatChallengeRateLimitCountdown = (remainingSeconds: number) =>
	`You requested a new code too recently. Try again in ${remainingSeconds} second${
		remainingSeconds === 1 ? '' : 's'
	}.`;

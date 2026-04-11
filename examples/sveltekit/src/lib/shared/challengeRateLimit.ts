import * as v from 'valibot';

/**
 * Shared client/server shape for displaying a resend-code countdown in the UI.
 */
export const ChallengeRateLimitViewSchema = v.object({
	retryAfterSeconds: v.pipe(v.number(), v.integer()),
	readyMessage: v.string()
});

export type ChallengeRateLimitView = v.InferOutput<typeof ChallengeRateLimitViewSchema>;

export const CHALLENGE_RATE_LIMIT_READY_MESSAGE = 'You can request a new code now.';

/**
 * Format the countdown text shown when a user asks for another code too soon.
 */
export const formatChallengeRateLimitCountdown = (remainingSeconds: number) =>
	`You requested a new code too recently. Try again in ${remainingSeconds} second${
		remainingSeconds === 1 ? '' : 's'
	}.`;

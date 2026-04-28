import * as v from 'valibot';

/**
 * Shared client/server shape for displaying a resend-code countdown in the UI.
 */
export const ChallengeRateLimitViewSchema = v.object({
	retryAfterSeconds: v.pipe(v.number(), v.integer()),
	readyMessage: v.string()
});

export type ChallengeRateLimitView = v.InferOutput<typeof ChallengeRateLimitViewSchema>;

/**
 * Discriminated message payload carried by Superforms for the email-change
 * form. Lets a single `$emailMessage` channel surface either a success string
 * or a rate-limit countdown.
 */
export type AccountEmailFormMessage =
	| { type: 'success'; text: string }
	| { type: 'rateLimited'; rateLimit: ChallengeRateLimitView };

/**
 * Discriminated message payload carried by Superforms for the login form.
 * Surfaces either an informational notice (e.g. "an account already exists")
 * or a rate-limit countdown through a single `$message` channel.
 */
export type LoginFormMessage =
	| { type: 'notice'; text: string }
	| { type: 'rateLimited'; rateLimit: ChallengeRateLimitView };

/**
 * Discriminated message payload carried by Superforms for the signup form.
 * Surfaces either an informational notice (e.g. "no account exists for that
 * email") or a rate-limit countdown through a single `$message` channel.
 */
export type SignupFormMessage =
	| { type: 'notice'; text: string }
	| { type: 'rateLimited'; rateLimit: ChallengeRateLimitView };

export const CHALLENGE_RATE_LIMIT_READY_MESSAGE = 'You can request a new code now.';

/**
 * Format the countdown text shown when a user asks for another code too soon.
 */
export const formatChallengeRateLimitCountdown = (remainingSeconds: number) =>
	`You requested a new code too recently. Try again in ${remainingSeconds} second${
		remainingSeconds === 1 ? '' : 's'
	}.`;

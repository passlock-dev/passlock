import { resolve } from '$app/paths';

export const root = resolve('/');

export type ResendRedirectLocation =
	| '/login'
	| `/login?${string}`
	| '/signup'
	| `/signup?${string}`
	| '/account'
	| `/account?${string}`;

/**
 * Resend endpoints only return internal app locations.
 * Keep the narrow cast in one shared place instead of each component.
 */
export const asResendRedirectLocation = (location: string) => location as ResendRedirectLocation;

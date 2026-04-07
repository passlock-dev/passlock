import {
	accountPath,
	loginEmailPath,
	loginPasskeyPath,
	loginPath,
	signupPath,
	type AccountLocation,
	type LoginEmailLocation,
	type LoginLocation,
	type LoginPasskeyLocation,
	type QueryLocation,
	type SignupLocation
} from '$lib/shared/routes.js';

/**
 * Helpers for encoding small pieces of auth flow state into the URL.
 *
 * The sample uses query parameters for user-facing state that should survive a
 * redirect, such as "account exists", "challenge rate limited", or
 * "email updated". Sensitive secrets stay in HTTP-only cookies instead.
 */
type QueryValue = string | number | undefined | null | false;

const createLocation = <Path extends string>(path: Path, params: Record<string, QueryValue>) => {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === false) continue;
		searchParams.set(key, String(value));
	}

	const query = searchParams.toString();
	return (query ? `${path}?${query}` : path) as QueryLocation<Path>;
};

export type LoginQueryReason = 'account-exists' | 'challenge-rate-limited';
export type SignupQueryReason = 'no-account';
export type AccountEmailErrorReason = 'expired' | 'taken';

const isLoginQueryReason = (value: string | null): value is LoginQueryReason =>
	value === 'account-exists' || value === 'challenge-rate-limited';

const isSignupQueryReason = (value: string | null): value is SignupQueryReason =>
	value === 'no-account';

const isAccountEmailErrorReason = (value: string | null): value is AccountEmailErrorReason =>
	value === 'expired' || value === 'taken';

const getOptionalNumber = (value: string | null) => {
	if (!value) return undefined;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Parse the login page query params into a typed object the loader can trust.
 */
export const getLoginQueryState = (url: URL) => {
	const reasonValue = url.searchParams.get('reason');

	return {
		username: url.searchParams.get('username') ?? undefined,
		reason: isLoginQueryReason(reasonValue) ? reasonValue : undefined,
		retryAfterSeconds: getOptionalNumber(url.searchParams.get('retryAfterSeconds'))
	};
};

/**
 * Build a typed login route including any non-sensitive auth state that should
 * survive redirects.
 */
export const toLoginLocation = (
	state: {
		username?: string;
		reason?: LoginQueryReason;
		retryAfterSeconds?: number;
	} = {}
): LoginLocation => createLocation(loginPath, state);

/**
 * Parse the signup page query params into the subset this app understands.
 */
export const getSignupQueryState = (url: URL) => {
	const reasonValue = url.searchParams.get('reason');

	return {
		email: url.searchParams.get('email') ?? undefined,
		reason: isSignupQueryReason(reasonValue) ? reasonValue : undefined
	};
};

export const toSignupLocation = (
	state: { email?: string; reason?: SignupQueryReason } = {}
): SignupLocation => createLocation(signupPath, state);

/**
 * Parse account-page query params used after email verification redirects.
 */
export const getAccountQueryState = (url: URL) => {
	const errorValue = url.searchParams.get('email-error');

	return {
		email: url.searchParams.get('email') ?? undefined,
		emailUpdated: url.searchParams.get('email-updated') === '1',
		emailError: isAccountEmailErrorReason(errorValue) ? errorValue : undefined
	};
};

/**
 * Build a typed account route with only non-sensitive UI state in the query
 * string.
 */
export const toAccountLocation = (
	state: {
		email?: string;
		emailUpdated?: boolean;
		emailError?: AccountEmailErrorReason;
	} = {}
): AccountLocation =>
	createLocation(accountPath, {
		email: state.email,
		'email-updated': state.emailUpdated ? 1 : undefined,
		'email-error': state.emailError
	});

/**
 * Remove transient account-page messages once the UI has rendered them.
 */
export const clearAccountQueryState = (url: URL): AccountLocation => {
	url.searchParams.delete('email-updated');
	url.searchParams.delete('email-error');
	url.searchParams.delete('email');
	return createLocation(accountPath, Object.fromEntries(url.searchParams.entries()));
};

/**
 * Read the email/username that was used to pre-select passkeys on the passkey
 * login route.
 */
export const getLoginPasskeyQueryState = (url: URL) => ({
	username: url.searchParams.get('username') ?? undefined
});

export const toLoginPasskeyLocation = (state: { username?: string } = {}): LoginPasskeyLocation =>
	createLocation(loginPasskeyPath, state);

/**
 * Read the email/username that should receive an emailed code on the login
 * email route.
 */
export const getLoginEmailQueryState = (url: URL) => ({
	username: url.searchParams.get('username') ?? undefined
});

export const toLoginEmailLocation = (state: { username?: string } = {}): LoginEmailLocation =>
	createLocation(loginEmailPath, state);

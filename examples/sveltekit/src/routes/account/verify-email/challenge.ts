import { toAccountLocation, type AccountEmailErrorReason } from '$lib/shared/queryState.js';

/**
 * Redirect helper used when the email verification flow needs to return the
 * user to `/account` with a user-facing status message.
 */
export const getAccountEmailErrorLocation = (reason: AccountEmailErrorReason, email?: string) =>
	toAccountLocation({ emailError: reason, email });

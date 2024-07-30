export * from '@passlock/client'
export * from './token.js'
export * from './utils.js'

import type { VerifyEmail } from '@passlock/client'

export type ResendEmail = VerifyEmail & {
	user_id: string;
};

export type VerifyEmailData = {
	code: string;
	token?: string;
};

/**
 * Store the email in local storage so they don't
 * need to re-enter it during subsequent authentication
 *
 * @param email
 * @returns
 */
export const saveEmailLocally = (email: string) => localStorage.setItem('email', email);

export const getLocalEmail = () => localStorage.getItem('email');

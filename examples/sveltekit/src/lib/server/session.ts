/**
 * Session helpers for the sample's cookie-backed login model.
 *
 * The browser stores an opaque session token in a cookie. The server stores a
 * hashed secret plus timestamps that let the sample enforce idle expiry and
 * require a fresh passkey confirmation for sensitive account actions.
 */

export const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
export const SESSION_ID_LENGTH = 24;
export const SESSION_SECRET_LENGTH = 24;
export const SESSION_REFRESH_INTERVAL_MS = MS_IN_A_DAY;
export const SESSION_MAX_INACTIVE_MS = 30 * MS_IN_A_DAY;
// Sensitive actions require a passkey confirmation within this rolling window.
export const SESSION_PASSKEY_REAUTH_WINDOW_MS = 10 * 60 * 1000;

/**
 * Split the opaque `id.secret` token into the lookup id and the cleartext
 * secret that will be hashed and compared server-side.
 */
export const parseSessionToken = (token: string): { id: string; secret: string } | null => {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const [id, secret] = parts;
	if (!id || !secret) return null;

	return { id, secret };
};

/**
 * Decide whether the current session has a recent enough passkey confirmation
 * to allow sensitive account updates without prompting again.
 */
export const isRecentAuthentication = (lastPasskeyAuthentication: number | null): boolean => {
	if (lastPasskeyAuthentication === null) return false;
	return Date.now() - lastPasskeyAuthentication < SESSION_PASSKEY_REAUTH_WINDOW_MS;
};

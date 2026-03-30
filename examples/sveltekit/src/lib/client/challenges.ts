import { safeParse } from 'valibot';
import { ResendChallengeResponse } from '$lib/shared/schemas.js';

const RESEND_ERROR_MESSAGE = 'Unable to send a new code.';

const fallbackResponse = () => ({
	_tag: '@error/Error' as const,
	message: RESEND_ERROR_MESSAGE
});

/**
 * Trigger a "resend code" endpoint and parse the shared typed response.
 *
 * The endpoint may intentionally use non-2xx status codes for expected
 * outcomes such as rate limiting or redirects, so this helper validates the
 * JSON body regardless of HTTP status.
 */
export const resendChallenge = async (url: string) => {
	try {
		const response = await fetch(url, { method: 'POST' });
		const jsonResponse = await response.json().catch(() => null);
		const parsedResponse = safeParse(ResendChallengeResponse, jsonResponse);
		return parsedResponse.success ? parsedResponse.output : fallbackResponse();
	} catch {
		return fallbackResponse();
	}
};

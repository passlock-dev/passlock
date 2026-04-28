import type { EmailMessage, SendEmail } from './types';

/**
 * Development-only stand-in for a real email provider.
 *
 * Production apps would send `input.message` through a mail
 * service. This sample just logs the code locally so the signup/login flows
 * can be exercised without external infrastructure.
 */
export const sendEmail: SendEmail = async (input: EmailMessage) => {
	if (input.code) {
		console.log(`*** ${input.subject} ${input.code} [DEV ONLY] ***`);
	} else {
		console.log(`*** ${input.subject} [DEV ONLY] ***`);
	}
};

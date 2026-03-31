import { dev } from '$app/environment';
import EmailChanged from '$lib/emails/EmailChanged.svelte';
import OneTimeCode from '$lib/emails/OneTimeCode.svelte';
import { render } from 'svelte/server';

/**
 * Render the one-time-code email body from a Svelte component.
 *
 * The sample keeps email rendering intentionally simple so the auth flow stays
 * easy to follow.
 */
export const renderCodeChallengeEmail = ({
	firstName,
	code
}: {
	firstName: string;
	code: string;
}) => {
	const emailOutput = render(OneTimeCode, { props: { firstName, code } });
	return `<html><body>${emailOutput.body}</body></html>`;
};

export type SendCodeChallengeEmail = {
	email: string;
	firstName: string;
	code: string;
};

/**
 * Development-only stand-in for a real email provider.
 *
 * Production apps would send `renderCodeChallengeEmail(...)` through a mail
 * service. This sample just logs the code locally so the signup/login flows
 * can be exercised without external infrastructure.
 */
export const sendCodeChallengeEmail = async (input: SendCodeChallengeEmail) => {
	if (dev) {
		console.log(`*** Sending One Time Code to ${input.email} [STUBBED] ***`);
		console.log(`*** One Time Code: ${input.code} [DEV ONLY] ***`);
	}
};

/**
 * Render the "your email address changed" notification email.
 */
export const renderEmailChanged = ({ firstName }: { firstName: string }) => {
	const emailOutput = render(EmailChanged, { props: { firstName } });
	return `<html><body>${emailOutput.body}</body></html>`;
};

export type SendEmailUpdated = {
	email: string;
	firstName: string;
};

/**
 * Development-only stand-in for the security notification email sent after an
 * address change succeeds.
 */
export const sendEmailUpdated = async (input: SendEmailUpdated) => {
	if (dev) {
		console.log(`*** Sending email changed alert to ${input.email} [STUBBED] ***`);
	}
};

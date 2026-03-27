import { dev } from '$app/environment';
import EmailChanged from '$lib/emails/EmailChanged.svelte';
import OneTimeCode from '$lib/emails/OneTimeCode.svelte';
import { render } from 'svelte/server';

/**
 * Simple implementation to render an HTML email using a Svelte component
 *
 * @param param0
 * @returns
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
 * Stubbed implementation
 *
 * @param input
 */
export const sendCodeChallengeEmail = async (input: SendCodeChallengeEmail) => {
	if (dev) {
    console.log(`*** Sending One Time Code to ${input.email} [STUBBED] ***`);
		console.log(`*** One Time Code: ${input.code} [DEV ONLY] ***`);
	}
};

/**
 * Simple implementation to render an HTML email using a Svelte component
 *
 * @param param0
 * @returns
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
 * Stubbed implementation
 *
 * @param input
 */
export const sendEmailUpdated = async (input: SendEmailUpdated) => {
	if (dev) {
		console.log(`*** Sending email changed alert to ${input.email} [STUBBED] ***`);
	}
};

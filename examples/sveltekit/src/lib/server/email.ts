import { dev } from '$app/environment';
import EmailChanged from '$lib/emails/EmailChanged.svelte';
import OneTimeCode from '$lib/emails/OneTimeCode.svelte';
import { render } from 'svelte/server';

export const renderOtcEmail = ({ firstName, code }: { firstName: string; code: string }) => {
	const emailOutput = render(OneTimeCode, { props: { firstName, code } });
	return `<html><body>${emailOutput.body}</body></html>`;
};

export type SendOtcEmail = {
	email: string;
	firstName: string;
	code: string;
};

export const sendOtcEmail = async (input: SendOtcEmail) => {
	const email = renderOtcEmail(input);
	void email;

	if (dev) {
		console.log(`Sending one-time code email to ${input.email} [STUBBED]`);
		console.log(`Code: ${input.code}`);
	}
};

export const renderEmailChanged = ({ firstName }: { firstName: string }) => {
	const emailOutput = render(EmailChanged, { props: { firstName } });
	return `<html><body>${emailOutput.body}</body></html>`;
};

export type SendEmailUpdated = {
	email: string;
	firstName: string;
};

export const sendEmailUpdated = async (input: SendEmailUpdated) => {
	const email = renderEmailChanged(input);
	void email;

	if (dev) {
		console.log(`Sending email change alert to ${input.email} [STUBBED]`);
	}
};

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

	console.log(`Sending One Time Code to ${input.email} [STUBBED]`);
	console.log(`One Time Code: ${input.code}`);
	console.log(email);
};

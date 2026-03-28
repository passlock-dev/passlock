import { getPasslockConfig } from './passlock.js';
import * as PasslockServer from '@passlock/server/safe';
import { error as kitError } from '@sveltejs/kit';

export type MailboxChallengePurpose = 'login' | 'signup' | 'email-change';

export const createMailboxChallenge = async (input: {
	email: string;
	purpose: MailboxChallengePurpose;
	userId?: number | undefined;
}) => {
	const result = await PasslockServer.createMailboxChallenge({
		...getPasslockConfig(),
		email: input.email,
		purpose: input.purpose,
		userId: input.userId === undefined ? undefined : String(input.userId)
	});

	if (result.failure) {
		console.error('Unable to create mailbox challenge', result);
		kitError(500, 'Unable to create one-time code challenge');
	}

	return result.challenge;
};

export const verifyMailboxChallenge = async (input: { token: string; code: string }) =>
	PasslockServer.verifyMailboxChallenge({
		...getPasslockConfig(),
		...input
	});

export const deleteMailboxChallengeBestEffort = async (challengeId: string): Promise<void> => {
	try {
		const result = await PasslockServer.deleteMailboxChallenge({
			...getPasslockConfig(),
			challengeId
		});

		if (result.failure) {
			console.warn(`Unable to delete mailbox challenge ${challengeId}`, result);
		}
	} catch (error) {
		console.warn(`Unable to delete mailbox challenge ${challengeId}`, error);
	}
};

import db from '$lib/server/db';
import {
	passkeysTable,
	sessionsTable,
	signupChallengesTable,
	userChallengesTable,
	usersTable
} from '$lib/server/dbSchema';
import {
	PUBLIC_PASSLOCK_TENANCY_ID as tenancyId,
	PUBLIC_PASSLOCK_ENDPOINT as endpoint
} from '$env/static/public';
import { PASSLOCK_API_KEY as apiKey } from '$env/static/private';
import { deleteMailboxChallenge, deletePasskey } from '@passlock/server';
import { eq } from 'drizzle-orm';
import { intro, outro, log, confirm, isCancel } from '@clack/prompts';

const findAllPasskeys = async () => {
	const passkeys = await db
		.selectDistinct({ passkeyId: passkeysTable.passkeyId })
		.from(passkeysTable);
	return passkeys.map((passkey) => passkey.passkeyId);
};

const findAllChallengeIds = async () => {
	const [userChallenges, signupChallenges] = await Promise.all([
		db.selectDistinct({ challengeId: userChallengesTable.challengeId }).from(userChallengesTable),
		db
			.selectDistinct({ challengeId: signupChallengesTable.challengeId })
			.from(signupChallengesTable)
	]);

	return [
		...new Set([...userChallenges, ...signupChallenges].map((challenge) => challenge.challengeId))
	];
};

const deletePasskeys = async (passkeyIds: Array<string>) => {
	for (const passkeyId of passkeyIds) {
		await deletePasskey({ tenancyId, apiKey, endpoint, passkeyId });
		await db.delete(passkeysTable).where(eq(passkeysTable.passkeyId, passkeyId));
		console.log(`Deleted passkey ${passkeyId}`);
	}
};

const deleteMailboxChallenges = async (challengeIds: string[]) => {
	for (const challengeId of challengeIds) {
		try {
			await deleteMailboxChallenge({ tenancyId, apiKey, endpoint, challengeId });
			console.log(`Deleted challenge ${challengeId}`);
		} catch (error) {
			console.warn(`Unable to delete challenge ${challengeId}`, error);
		}
	}
};

const reset = async () => {
	log.info('Deleting passkeys');
	const passkeys = await findAllPasskeys();
	await deletePasskeys(passkeys);

	log.info(`Deleting sessions`);
	await db.delete(sessionsTable);

	log.info(`Deleting one time codes`);
	const challengeIds = await findAllChallengeIds();
	await deleteMailboxChallenges(challengeIds);
	await db.delete(signupChallengesTable);
	await db.delete(userChallengesTable);

	log.info(`Deleting users`);
	await db.delete(usersTable);
};

// reset();

intro(`Reset Example app data`);
log.warn(
	'This will delete all data from your local database. \nIt will also remove the relevant passkeys from your Passlock vault'
);

const result = await confirm({ message: 'Do you want to continue?' });
if (isCancel(result) || result === false) {
	process.exit(0);
} else {
	await reset();
}

outro(`Done 🔥`);

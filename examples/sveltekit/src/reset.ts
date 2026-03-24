import db from '$lib/server/db';
import {
	otcChallengesTable,
	passkeysTable,
	sessionsTable,
	usersTable
} from '$lib/server/schema';
import {
	PUBLIC_PASSLOCK_TENANCY_ID as tenancyId,
	PUBLIC_PASSLOCK_ENDPOINT as endpoint
} from '$env/static/public';
import { PASSLOCK_API_KEY as apiKey } from '$env/static/private';
import { deletePasskey } from '@passlock/server';
import { eq } from 'drizzle-orm';
import { intro, outro, log, confirm, isCancel } from '@clack/prompts';

const findAllPasskeys = async () => {
	const passkeys = await db
		.selectDistinct({ passkeyId: passkeysTable.passkeyId })
		.from(passkeysTable);
	return passkeys.map((passkey) => passkey.passkeyId);
};

const deletePasskeys = async (passkeyIds: Array<string>) => {
	for (const passkeyId of passkeyIds) {
		await deletePasskey({ tenancyId, apiKey, endpoint, passkeyId });
		await db.delete(passkeysTable).where(eq(passkeysTable.passkeyId, passkeyId));
		console.log(`Deleted passkey ${passkeyId}`);
	}
};

const reset = async () => {
	log.info('Deleting passkeys');
	const passkeys = await findAllPasskeys();
	await deletePasskeys(passkeys);

	log.info(`Deleting sessions`);
	await db.delete(sessionsTable);

	log.info(`Deleting one time codes`);
	await db.delete(otcChallengesTable);

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

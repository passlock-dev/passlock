import db from '$lib/server/db';
import { passkeysTable, sessionsTable, usersTable } from '$lib/server/dbSchema';
import { getPasslockConfig } from '$lib/server/passlock';
import { confirm, intro, isCancel, log, outro } from '@clack/prompts';
import * as PasslockServer from '@passlock/server';
import { eq } from 'drizzle-orm';

const findAllPasskeys = async () => {
	const passkeys = await db
		.selectDistinct({ passkeyId: passkeysTable.passkeyId })
		.from(passkeysTable);
	return passkeys.map((passkey) => passkey.passkeyId);
};

const deletePasskeys = async (passkeyIds: Array<string>) => {
	for (const passkeyId of passkeyIds) {
		const result = await PasslockServer.deletePasskey({ passkeyId }, getPasslockConfig());
		if (!result.success) {
			log.warn('Warning: passkey no longer exists in Passlock vault');
		}
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

	log.info(`Deleting users`);
	await db.delete(usersTable);

	log.info('Leaving pending one-time codes to expire in Passlock');
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

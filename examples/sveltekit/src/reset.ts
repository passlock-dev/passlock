import db from '#lib/server/db.js';
import {
	passkeysTable,
	sessionsTable,
	totpAuthenticatorsTable,
	usersTable
} from '#lib/server/dbSchema.js';
import { getPasslockConfig } from '#lib/server/passlock.js';
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
	if (passkeyIds.length === 0) return;

	const result = await PasslockServer.deletePasskeys({ passkeyIds }, getPasslockConfig());
	if (!result.success) {
		log.warn('Warning: unable to delete passkeys from Passlock vault');
	} else {
		for (const warning of result.warnings) {
			log.warn(warning.message);
		}
	}

	for (const passkeyId of passkeyIds) {
		await db.delete(passkeysTable).where(eq(passkeysTable.passkeyId, passkeyId));
		console.log(`Deleted passkey ${passkeyId}`);
	}
};

const deleteTotpAuthenticators = async () => {
	const authenticators = await db
		.select({
			authenticatorId: totpAuthenticatorsTable.authenticatorId,
			userId: totpAuthenticatorsTable.userId
		})
		.from(totpAuthenticatorsTable);

	for (const { authenticatorId, userId } of authenticators) {
		const result = await PasslockServer.deleteTotpAuthenticator(
			{ authenticatorId, userId: String(userId) },
			getPasslockConfig()
		);
		if (result.failure && result._tag !== '@error/NotFound') {
			log.warn(`Warning: unable to delete TOTP authenticator ${authenticatorId} from Passlock`);
		}
	}

	await db.delete(totpAuthenticatorsTable);
};

const reset = async () => {
	log.info('Deleting passkeys');
	const passkeys = await findAllPasskeys();
	await deletePasskeys(passkeys);

	log.info('Deleting TOTP authenticators');
	await deleteTotpAuthenticators();

	log.info(`Deleting sessions`);
	await db.delete(sessionsTable);

	log.info(`Deleting users`);
	await db.delete(usersTable);

	log.info('Leaving pending one-time codes to expire in Passlock');
};

// reset();

intro(`Reset Example app data`);
log.warn(
	'This will delete all data from your local database. \nIt will also remove the relevant passkeys and TOTP authenticators from your Passlock vault'
);

const result = await confirm({ message: 'Do you want to continue?' });
if (isCancel(result) || result === false) {
	process.exit(0);
} else {
	await reset();
}

outro(`Done 🔥`);

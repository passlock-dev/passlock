import type db from './db';
import { sessionsTable } from './dbSchema';
import { generateRandomString } from './utils';
import { hashText } from './hashing';
import { SESSION_ID_LENGTH, SESSION_SECRET_LENGTH } from './session';
import type { CreatedSession } from './repository';

/** Insert a new session using either the database or the caller's transaction. */
export const createSessionRecord = async (
	database: Pick<typeof db, 'insert'>,
	userId: number,
	options?: { passkeyVerified?: boolean; totpVerified?: boolean }
): Promise<CreatedSession> => {
	const id = generateRandomString(SESSION_ID_LENGTH);
	const secret = generateRandomString(SESSION_SECRET_LENGTH);
	const now = Date.now();
	const totpAuthenticatedAt = options?.totpVerified ? now : null;
	const passkeyAuthenticatedAt = options?.passkeyVerified ? now : null;
	await database.insert(sessionsTable).values({
		id,
		userId,
		secretHash: hashText(secret),
		createdAt: now,
		lastVerifiedAt: now,
		passkeyAuthenticatedAt,
		totpAuthenticatedAt
	});
	return {
		_tag: 'CreatedSession',
		token: `${id}.${secret}`,
		session: {
			_tag: 'Session',
			id,
			userId,
			createdAt: now,
			lastVerifiedAt: now,
			passkeyAuthenticatedAt,
			totpAuthenticatedAt,
			accountDeletionAuthorizedAt: null
		}
	};
};

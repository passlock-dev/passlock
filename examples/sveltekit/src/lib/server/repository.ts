/**
 * Repository layer for the example app's local account, session, and passkey
 * state.
 *
 * Passlock-backed mailbox challenge flows live in `./challenges.ts`. This
 * module owns only the local SQLite records the app uses for routing, UI, and
 * authorization decisions.
 */

import { DrizzleQueryError } from 'drizzle-orm/errors';
import { and, count, desc, eq } from 'drizzle-orm';
import { LibsqlError } from '@libsql/client';
import db from './db';
import { passkeysTable, sessionsTable, usersTable } from './dbSchema';
import { hashText, isEqualHash } from './hashing';
import {
	parseSessionToken,
	SESSION_MAX_INACTIVE_MS,
	SESSION_REFRESH_INTERVAL_MS,
	SESSION_ID_LENGTH,
	SESSION_SECRET_LENGTH
} from './session';
import { generateRandomString } from './utils';

/**
 * Data required to create a new local user account after signup verification.
 */
export type CreateUser = {
	email: string;
	givenName: string;
	familyName: string;
};

/**
 * Editable profile fields stored on the local user record.
 */
export type UpdateUserNames = {
	givenName: string;
	familyName: string;
};

/**
 * Minimal user record returned when a new account is created locally.
 */
export type User = {
	_tag: 'User';
	userId: number;
	email: string;
	createdAt: number;
};

/**
 * Returned when a unique email constraint prevents account creation or update.
 */
export type DuplicateUser = {
	_tag: '@error/DuplicateUser';
	email: string;
};

/**
 * Returned when a flow expects a local account that no longer exists.
 */
export type AccountNotFound = {
	_tag: '@error/AccountNotFound';
	email: string;
};

/**
 * Passkey record as stored in the local SQLite database.
 */
export type Passkey = {
	_tag: 'Passkey';
	userId: number;
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	platformIcon: string | null;
	createdAt: number;
};

/**
 * Returned when a passkey id is already linked to a local account.
 */
export type DuplicatePasskey = {
	_tag: '@error/DuplicatePasskey';
	passkeyId: string;
};

/**
 * Returned when a requested local passkey record no longer exists.
 */
export type PasskeyNotFound = {
	_tag: '@error/PasskeyNotFound';
	passkeyId: string;
};

/**
 * Server-side session record stored in SQLite.
 */
export type Session = {
	_tag: 'Session';
	id: string;
	userId: number;
	createdAt: number;
	// when the session token was checked
	lastVerifiedAt: number;
	// when the last passkey based authentication took place
	passkeyAuthenticatedAt: number | null;
};

/**
 * User data hydrated into `event.locals` alongside a validated session.
 */
export type SessionUser = {
	_tag: 'SessionUser';
	userId: number;
	email: string;
	givenName: string;
	familyName: string;
};

/**
 * Result of validating a session cookie against the local database.
 */
export type SessionValidationResult = {
	_tag: 'SessionValidationResult';
	session: Session;
	user: SessionUser;
	fresh: boolean;
};

/**
 * Newly created session plus the opaque token sent to the browser cookie.
 */
export type CreatedSession = {
	_tag: 'CreatedSession';
	session: Session;
	token: string;
};

/**
 * Metadata persisted locally after Passlock confirms a passkey registration.
 */
export type CreatePasskey = {
	userId: number;
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	platformIcon: string | null;
};

const isSqliteConstraintError = (e: unknown): e is DrizzleQueryError & { cause: LibsqlError } => {
	if (!(e instanceof DrizzleQueryError)) return false;
	if (!(e.cause instanceof LibsqlError)) return false;

	return (
		e.cause.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
		e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY'
	);
};

/**
 * Create a local user record after signup has been verified by Passlock.
 */
export const createUser = async (newUser: CreateUser): Promise<User | DuplicateUser> => {
	const { email, givenName, familyName } = newUser;

	try {
		const createdAt = Date.now();
		const users = await db
			.insert(usersTable)
			.values({ email, givenName, familyName, createdAt })
			.returning({ userId: usersTable.id, createdAt: usersTable.createdAt });

		const { userId } = users[0];

		return { _tag: 'User', userId, email, createdAt };
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: '@error/DuplicateUser', email };
	}
};

/**
 * Read a local account by numeric user id.
 */
export const getUserById = async (userId: number): Promise<SessionUser | null> => {
	const users = await db
		.select({
			userId: usersTable.id,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(usersTable)
		.where(eq(usersTable.id, userId))
		.limit(1);

	const user = users[0];
	return user ? { _tag: 'SessionUser', ...user } : null;
};

/**
 * Read a local account by email address.
 */
export const getUserByEmail = async (email: string): Promise<SessionUser | null> => {
	const users = await db
		.select({
			userId: usersTable.id,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	const user = users[0];
	return user ? { _tag: 'SessionUser', ...user } : null;
};

/**
 * Update the locally stored given/family names for an account.
 */
export const updateUserNames = async (
	userId: number,
	updateUser: UpdateUserNames
): Promise<SessionUser | null> => {
	const { givenName, familyName } = updateUser;

	const users = await db
		.update(usersTable)
		.set({ givenName, familyName })
		.where(eq(usersTable.id, userId))
		.returning({
			userId: usersTable.id,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		});

	const user = users[0];
	return user ? { _tag: 'SessionUser', ...user } : null;
};

/**
 * Update the local email address for an account, returning a duplicate error
 * when another account already owns the new email.
 */
export const updateUserEmail = async (
	userId: number,
	email: string
): Promise<SessionUser | DuplicateUser | null> => {
	try {
		const users = await db
			.update(usersTable)
			.set({ email })
			.where(eq(usersTable.id, userId))
			.returning({
				userId: usersTable.id,
				email: usersTable.email,
				givenName: usersTable.givenName,
				familyName: usersTable.familyName
			});

		const user = users[0];
		return user ? { _tag: 'SessionUser', ...user } : null;
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: '@error/DuplicateUser', email };
	}
};

/**
 * Delete the local account plus all local sessions and passkey records.
 *
 * The surrounding route flow deletes passkeys from Passlock before calling
 * this so the local transaction only needs to clean up app data.
 */
export const deleteUser = async (userId: number): Promise<boolean> => {
	return await db.transaction(async (tx) => {
		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
		await tx.delete(passkeysTable).where(eq(passkeysTable.userId, userId));

		const deletedUsers = await tx
			.delete(usersTable)
			.where(eq(usersTable.id, userId))
			.returning({ userId: usersTable.id });

		return Boolean(deletedUsers[0]);
	});
};

/**
 * Persist a newly verified passkey in the local database.
 */
export const createPasskey = async (
	createPasskey: CreatePasskey
): Promise<Passkey | DuplicatePasskey> => {
	const { userId, passkeyId, username, platformName, platformIcon } = createPasskey;

	const createdAt = Date.now();

	try {
		await db.insert(passkeysTable).values({
			userId,
			passkeyId,
			username,
			platformName,
			platformIcon,
			createdAt
		});
	} catch (e) {
		if (!isSqliteConstraintError(e)) throw e;
		return { _tag: '@error/DuplicatePasskey', passkeyId };
	}

	return {
		_tag: 'Passkey',
		userId,
		passkeyId,
		username,
		platformName,
		platformIcon,
		createdAt
	};
};

/**
 * Resolve a passkey id to the owning local user.
 */
export const getUserByPasskeyId = async (passkeyId: string): Promise<{ userId: number } | null> => {
	const users = await db
		.select({ userId: passkeysTable.userId })
		.from(passkeysTable)
		.where(eq(passkeysTable.passkeyId, passkeyId))
		.limit(1);

	return users[0] ?? null;
};

/**
 * Count the passkeys linked to a local user for account-management UI.
 */
export const countPasskeysByUserId = async (userId: number): Promise<number> => {
	const rows = await db
		.select({ count: count() })
		.from(passkeysTable)
		.where(eq(passkeysTable.userId, userId));

	const row = rows[0];
	return row ? row.count : 0;
};

/**
 * List the passkeys linked to a local user for account-management UI.
 */
export const getPasskeysByUserId = async (userId: number): Promise<Passkey[]> => {
	return await db
		.select({
			userId: passkeysTable.userId,
			passkeyId: passkeysTable.passkeyId,
			username: passkeysTable.username,
			platformName: passkeysTable.platformName,
			platformIcon: passkeysTable.platformIcon,
			createdAt: passkeysTable.createdAt
		})
		.from(passkeysTable)
		.where(eq(passkeysTable.userId, userId))
		.orderBy(desc(passkeysTable.createdAt))
		.then((passkeys) => passkeys.map((passkey) => ({ _tag: 'Passkey', ...passkey })));
};

/**
 * Find passkeys by username/email so the passkey login route can pre-select
 * credentials for a known account.
 */
export const getPasskeysByUsername = async (email: string): Promise<Passkey[]> => {
	return await db
		.select({
			userId: passkeysTable.userId,
			passkeyId: passkeysTable.passkeyId,
			username: passkeysTable.username,
			platformName: passkeysTable.platformName,
			platformIcon: passkeysTable.platformIcon,
			createdAt: passkeysTable.createdAt
		})
		.from(passkeysTable)
		.innerJoin(usersTable, eq(passkeysTable.userId, usersTable.id))
		.where(eq(usersTable.email, email))
		.orderBy(desc(passkeysTable.createdAt))
		.then((passkeys) => passkeys.map((passkey) => ({ _tag: 'Passkey', ...passkey })));
};

/**
 * Update the locally stored username for every passkey linked to a user.
 */
export const updatePasskeysByUserId = async (
	userId: number,
	{ username }: { username: string }
): Promise<number> => {
	const rows = await db
		.update(passkeysTable)
		.set({ username })
		.where(eq(passkeysTable.userId, userId));

	return rows.rowsAffected;
};

/**
 * Delete one local passkey association for a specific user.
 */
export const deletePasskeyByUserId = async (
	userId: number,
	passkeyId: string
): Promise<boolean> => {
	const deleted = await db
		.delete(passkeysTable)
		.where(and(eq(passkeysTable.userId, userId), eq(passkeysTable.passkeyId, passkeyId)))
		.returning({ passkeyId: passkeysTable.passkeyId });

	return Boolean(deleted[0]);
};

/**
 * Create a new local session and return the opaque token that should be set in
 * the browser cookie.
 *
 * `passkeyVerified` is used when login or re-authentication has just been
 * completed with a passkey, allowing sensitive actions to proceed for a short
 * window afterwards.
 */
export const createSession = async (
	userId: number,
	options?: { passkeyVerified?: boolean }
): Promise<CreatedSession> => {
	for (let i = 0; i < 5; i++) {
		const sessionId = generateRandomString(SESSION_ID_LENGTH);
		const sessionSecret = generateRandomString(SESSION_SECRET_LENGTH);
		const secretHash = hashText(sessionSecret);
		const token = `${sessionId}.${sessionSecret}`;
		const now = Date.now();
		const passkeyAuthenticatedAt = options?.passkeyVerified ? now : null;

		try {
			await db.insert(sessionsTable).values({
				id: sessionId,
				userId,
				secretHash,
				createdAt: now,
				lastVerifiedAt: now,
				passkeyAuthenticatedAt
			});
		} catch (e) {
			if (isSqliteConstraintError(e) && e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
				continue;
			}

			throw e;
		}

		return {
			_tag: 'CreatedSession' as const,
			session: {
				_tag: 'Session',
				id: sessionId,
				userId,
				createdAt: now,
				lastVerifiedAt: now,
				passkeyAuthenticatedAt
			},
			token
		};
	}

	throw new Error('Unable to create session');
};

/**
 * Validate an opaque session token against the local session store and return
 * the corresponding user/session for `event.locals`.
 */
export const validateSessionToken = async (
	token: string
): Promise<SessionValidationResult | null> => {
	const sessionToken = parseSessionToken(token);
	if (!sessionToken) return null;

	const rows = await db
		.select({
			sessionId: sessionsTable.id,
			userId: sessionsTable.userId,
			secretHash: sessionsTable.secretHash,
			createdAt: sessionsTable.createdAt,
			lastVerifiedAt: sessionsTable.lastVerifiedAt,
			passkeyAuthenticatedAt: sessionsTable.passkeyAuthenticatedAt,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(sessionsTable)
		.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
		.where(eq(sessionsTable.id, sessionToken.id))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	const suppliedSecretHash = hashText(sessionToken.secret);
	if (!isEqualHash(row.secretHash, suppliedSecretHash)) return null;

	const now = Date.now();
	if (now - row.lastVerifiedAt >= SESSION_MAX_INACTIVE_MS) {
		await invalidateSession(row.sessionId);
		return null;
	}

	let fresh = false;
	let lastVerifiedAt = row.lastVerifiedAt;
	if (now - row.lastVerifiedAt >= SESSION_REFRESH_INTERVAL_MS) {
		lastVerifiedAt = now;
		fresh = true;

		await db
			.update(sessionsTable)
			.set({ lastVerifiedAt })
			.where(eq(sessionsTable.id, row.sessionId));
	}

	return {
		_tag: 'SessionValidationResult' as const,
		session: {
			_tag: 'Session',
			id: row.sessionId,
			userId: row.userId,
			createdAt: row.createdAt,
			passkeyAuthenticatedAt: row.passkeyAuthenticatedAt,
			lastVerifiedAt
		},
		user: {
			_tag: 'SessionUser',
			userId: row.userId,
			email: row.email,
			givenName: row.givenName,
			familyName: row.familyName
		},
		fresh
	};
};

/**
 * Mark the current session as recently passkey-authenticated.
 */
export const refreshPasskeyAuthenticatedAt = async (sessionId: string): Promise<void> => {
	await db
		.update(sessionsTable)
		.set({ passkeyAuthenticatedAt: Date.now() })
		.where(eq(sessionsTable.id, sessionId));
};

/**
 * Delete a single local session, for example during logout.
 */
export const invalidateSession = async (sessionId: string): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
};

/**
 * Delete every local session belonging to the supplied user.
 */
export const invalidateSessionsByUserId = async (userId: number): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
};

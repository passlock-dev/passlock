/**
 * DrizzleORM based repository
 */
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { LibsqlError } from '@libsql/client';
import db from './db';
import {
	passkeysTable,
	otcChallengesTable,
	passwordsTable,
	sessionsTable,
	usersTable
} from './schema';
import {
	PASSWORD_LOGIN_CHALLENGE_ID_LENGTH,
	PASSWORD_LOGIN_CHALLENGE_SECRET_LENGTH,
	PASSWORD_LOGIN_CHALLENGE_TTL_MS,
	PASSWORD_LOGIN_CODE_TTL_MS,
	generatePasswordLoginCode,
	hashPasswordLoginCode,
	hashPasswordLoginSecret,
	isSamePasswordLoginHash,
	parsePendingPasswordLoginToken
} from './password-login';
import {
	hashSessionSecret,
	isSameSecretHash,
	parseSessionToken,
	SESSION_MAX_INACTIVE_MS,
	SESSION_REFRESH_INTERVAL_MS,
	SESSION_ID_LENGTH,
	SESSION_SECRET_LENGTH
} from './session';
import { generateRandomString } from './utils';

export type CreateUser = {
	email: string;
	givenName: string;
	familyName: string;
	passwordHash: string;
};

export type UpdateUserProfile = {
	email: string;
	givenName: string;
	familyName: string;
};

export type User = {
	_tag: 'User';
	userId: number;
	email: string;
	createdAt: number;
};

export type DuplicateUser = {
	_tag: 'DuplicateUser';
	email: string;
};

export type Passkey = {
	_tag: 'Passkey';
	userId: number;
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	createdAt: number;
};

export type DuplicatePasskey = {
	_tag: 'DuplicatePasskey';
	passkeyId: string;
};

export type PasskeyNotFound = {
	_tag: 'PasskeyNotFound';
	passkeyId: string;
};

export type UserPasskey = {
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	platformIcon: string | null;
	createdAt: number;
};

export type UserPassword = {
	userId: number;
	email: string;
	givenName: string;
	passwordHash: string;
};

export type PasswordLoginChallenge = {
	id: string;
	userId: number;
	createdAt: number;
	codeExpiresAt: number;
	challengeExpiresAt: number;
};

export type ActivePasswordLoginChallenge = PasswordLoginChallenge & {
	codeHash: string;
};

export type PendingOtcContext = {
	challenge: PasswordLoginChallenge;
	user: SessionUser;
};

export type CreatedPasswordLoginChallenge = {
	challenge: PasswordLoginChallenge;
	token: string;
	code: string;
};

export type Session = {
	id: string;
	userId: number;
	createdAt: number;
	lastVerifiedAt: number;
};

export type SessionUser = {
	userId: number;
	email: string;
	givenName: string;
	familyName: string;
};

export type SessionValidationResult = {
	session: Session;
	user: SessionUser;
	fresh: boolean;
};

export type CreatedSession = {
	session: Session;
	token: string;
};

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

export const createUser = async (newUser: CreateUser): Promise<User | DuplicateUser> => {
	const { email, givenName, familyName, passwordHash } = newUser;

	try {
		return await db.transaction(async (tx) => {
			const createdAt = Date.now();
			const user = await tx
				.insert(usersTable)
				.values({ email, givenName, familyName, createdAt })
				.returning({ userId: usersTable.id, createdAt: usersTable.createdAt });

			const userId = user[0].userId;
			await tx.insert(passwordsTable).values({ userId, passwordHash, createdAt });

			return { _tag: 'User', userId, email, createdAt: user[0].createdAt };
		});
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: 'DuplicateUser', email };
	}
};

export const updateUserProfile = async (
	userId: number,
	updateUser: UpdateUserProfile
): Promise<SessionUser | DuplicateUser | null> => {
	const { email, givenName, familyName } = updateUser;

	try {
		const users = await db
			.update(usersTable)
			.set({ email, givenName, familyName })
			.where(eq(usersTable.id, userId))
			.returning({
				userId: usersTable.id,
				email: usersTable.email,
				givenName: usersTable.givenName,
				familyName: usersTable.familyName
			});

		return users[0] ?? null;
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: 'DuplicateUser', email };
	}
};

export const getUserByEmail = async (email: string): Promise<UserPassword | null> => {
	const users = await db
		.select({
			userId: usersTable.id,
			email: usersTable.email,
			givenName: usersTable.givenName,
			passwordHash: passwordsTable.passwordHash
		})
		.from(usersTable)
		.innerJoin(passwordsTable, eq(usersTable.id, passwordsTable.userId))
		.where(eq(usersTable.email, email))
		.limit(1);

	return users[0] ?? null;
};

const deleteExpiredPasswordLoginChallenges = async (userId: number): Promise<void> => {
	await db
		.delete(otcChallengesTable)
		.where(
			and(
				eq(otcChallengesTable.userId, userId),
				lt(otcChallengesTable.challengeExpiresAt, Date.now())
			)
		);
};

export const createOtcChallenge = async (
	userId: number
): Promise<CreatedPasswordLoginChallenge> => {
	await deleteExpiredPasswordLoginChallenges(userId);

	for (let i = 0; i < 5; i++) {
		const challengeId = generateRandomString(PASSWORD_LOGIN_CHALLENGE_ID_LENGTH);
		const challengeSecret = generateRandomString(PASSWORD_LOGIN_CHALLENGE_SECRET_LENGTH);
		const token = `${challengeId}.${challengeSecret}`;
		const code = generatePasswordLoginCode();
		const now = Date.now();

		try {
			await db.insert(otcChallengesTable).values({
				id: challengeId,
				userId,
				secretHash: hashPasswordLoginSecret(challengeSecret),
				codeHash: hashPasswordLoginCode(code),
				createdAt: now,
				codeExpiresAt: now + PASSWORD_LOGIN_CODE_TTL_MS,
				challengeExpiresAt: now + PASSWORD_LOGIN_CHALLENGE_TTL_MS
			});
		} catch (e) {
			if (isSqliteConstraintError(e) && e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
				continue;
			}

			throw e;
		}

		return {
			challenge: {
				id: challengeId,
				userId,
				createdAt: now,
				codeExpiresAt: now + PASSWORD_LOGIN_CODE_TTL_MS,
				challengeExpiresAt: now + PASSWORD_LOGIN_CHALLENGE_TTL_MS
			},
			token,
			code
		};
	}

	throw new Error('Unable to create password login challenge');
};

export const getPendingOtcContext = async (
	token: string
): Promise<PendingOtcContext | null> => {
	const parsedToken = parsePendingPasswordLoginToken(token);
	if (!parsedToken) return null;

	const rows = await db
		.select({
			id: otcChallengesTable.id,
			userId: otcChallengesTable.userId,
			secretHash: otcChallengesTable.secretHash,
			createdAt: otcChallengesTable.createdAt,
			codeExpiresAt: otcChallengesTable.codeExpiresAt,
			challengeExpiresAt: otcChallengesTable.challengeExpiresAt,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(otcChallengesTable)
		.innerJoin(usersTable, eq(otcChallengesTable.userId, usersTable.id))
		.where(eq(otcChallengesTable.id, parsedToken.sessionId))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	const suppliedSecretHash = hashPasswordLoginSecret(parsedToken.sessionSecret);
	if (!isSamePasswordLoginHash(row.secretHash, suppliedSecretHash)) return null;

	if (Date.now() > row.challengeExpiresAt) {
		await db
			.delete(otcChallengesTable)
			.where(eq(otcChallengesTable.id, row.id));
		return null;
	}

	return {
		challenge: {
			id: row.id,
			userId: row.userId,
			createdAt: row.createdAt,
			codeExpiresAt: row.codeExpiresAt,
			challengeExpiresAt: row.challengeExpiresAt
		},
		user: {
			userId: row.userId,
			email: row.email,
			givenName: row.givenName,
			familyName: row.familyName
		}
	};
};

export const getActivePasswordLoginChallengesByUserId = async (
	userId: number
): Promise<ActivePasswordLoginChallenge[]> => {
	await deleteExpiredPasswordLoginChallenges(userId);

	const now = Date.now();

	return await db
		.select({
			id: otcChallengesTable.id,
			userId: otcChallengesTable.userId,
			codeHash: otcChallengesTable.codeHash,
			createdAt: otcChallengesTable.createdAt,
			codeExpiresAt: otcChallengesTable.codeExpiresAt,
			challengeExpiresAt: otcChallengesTable.challengeExpiresAt
		})
		.from(otcChallengesTable)
		.where(
			and(
				eq(otcChallengesTable.userId, userId),
				gte(otcChallengesTable.challengeExpiresAt, now),
				gte(otcChallengesTable.codeExpiresAt, now)
			)
		)
		.orderBy(desc(otcChallengesTable.createdAt));
};

export const deletePasswordLoginChallengesByUserId = async (userId: number): Promise<void> => {
	await db
		.delete(otcChallengesTable)
		.where(eq(otcChallengesTable.userId, userId));
};

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
		return { _tag: 'DuplicatePasskey', passkeyId };
	}

	return {
		_tag: 'Passkey',
		userId,
		passkeyId,
		username,
		platformName,
		createdAt
	};
};

export const getUserByPasskeyId = async (passkeyId: string): Promise<{ userId: number } | null> => {
	const users = await db
		.select({ userId: passkeysTable.userId })
		.from(passkeysTable)
		.where(eq(passkeysTable.passkeyId, passkeyId))
		.limit(1);

	return users[0] ?? null;
};

export const getPasskeysByUserId = async (userId: number): Promise<UserPasskey[]> => {
	return await db
		.select({
			passkeyId: passkeysTable.passkeyId,
			username: passkeysTable.username,
			platformName: passkeysTable.platformName,
			platformIcon: passkeysTable.platformIcon,
			createdAt: passkeysTable.createdAt
		})
		.from(passkeysTable)
		.where(eq(passkeysTable.userId, userId))
		.orderBy(desc(passkeysTable.createdAt));
};

export const getPasskeysByUsername = async (email: string): Promise<UserPasskey[]> => {
	return await db
		.select({
			passkeyId: passkeysTable.passkeyId,
			username: passkeysTable.username,
			platformName: passkeysTable.platformName,
			platformIcon: passkeysTable.platformIcon,
			createdAt: passkeysTable.createdAt
		})
		.from(passkeysTable)
		.innerJoin(usersTable, eq(passkeysTable.userId, usersTable.id))
		.where(eq(usersTable.email, email))
		.orderBy(desc(passkeysTable.createdAt));
};

export const updatePasskeysByUserId = async (
	userId: number,
	{ username }: { username: string }
): Promise<number> => {
	const results = await db
		.update(passkeysTable)
		.set({ username })
		.where(eq(passkeysTable.userId, userId));

	return results.rowsAffected;
};

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

export const createSession = async (userId: number): Promise<CreatedSession> => {
	for (let i = 0; i < 5; i++) {
		const sessionId = generateRandomString(SESSION_ID_LENGTH);
		const sessionSecret = generateRandomString(SESSION_SECRET_LENGTH);
		const secretHash = hashSessionSecret(sessionSecret);
		const token = `${sessionId}.${sessionSecret}`;
		const now = Date.now();

		try {
			await db.insert(sessionsTable).values({
				id: sessionId,
				userId,
				secretHash,
				createdAt: now,
				lastVerifiedAt: now
			});
		} catch (e) {
			if (isSqliteConstraintError(e) && e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
				continue;
			}

			throw e;
		}

		return {
			session: { id: sessionId, userId, createdAt: now, lastVerifiedAt: now },
			token
		};
	}

	throw new Error('Unable to create session');
};

export const validateSessionToken = async (
	token: string
): Promise<SessionValidationResult | null> => {
	const sessionToken = parseSessionToken(token);
	if (!sessionToken) return null;

	const result = await db
		.select({
			sessionId: sessionsTable.id,
			userId: sessionsTable.userId,
			secretHash: sessionsTable.secretHash,
			createdAt: sessionsTable.createdAt,
			lastVerifiedAt: sessionsTable.lastVerifiedAt,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(sessionsTable)
		.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
		.where(eq(sessionsTable.id, sessionToken.sessionId))
		.limit(1);

	const row = result[0];
	if (!row) return null;

	const suppliedSecretHash = hashSessionSecret(sessionToken.sessionSecret);
	if (!isSameSecretHash(row.secretHash, suppliedSecretHash)) return null;

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
		session: {
			id: row.sessionId,
			userId: row.userId,
			createdAt: row.createdAt,
			lastVerifiedAt
		},
		user: {
			userId: row.userId,
			email: row.email,
			givenName: row.givenName,
			familyName: row.familyName
		},
		fresh
	};
};

export const invalidateSession = async (sessionId: string): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
};

export const invalidateSessionsByUserId = async (userId: number): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
};

export const deleteUserAccount = async (userId: number): Promise<boolean> => {
	return await db.transaction(async (tx) => {
		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
		await tx.delete(passwordsTable).where(eq(passwordsTable.userId, userId));
		await tx.delete(passkeysTable).where(eq(passkeysTable.userId, userId));

		const deletedUsers = await tx
			.delete(usersTable)
			.where(eq(usersTable.id, userId))
			.returning({ userId: usersTable.id });

		return Boolean(deletedUsers[0]);
	});
};

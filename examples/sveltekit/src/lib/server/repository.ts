/**
 * DrizzleORM based repository
 */

import { DrizzleQueryError } from 'drizzle-orm/errors';
import { and, desc, eq, gte, isNull, lt, ne } from 'drizzle-orm';
import { LibsqlError } from '@libsql/client';
import db from './db';
import { challengesTable, passkeysTable, sessionsTable, usersTable } from './dbSchema';
import { hashText, isEqualHash } from './hashing';
import {
	generateCode,
	CHALLENGE_ID_LENGTH,
	CHALLENGE_SECRET_LENGTH,
	CHALLENGE_FLOW_TTL_MS,
	CHALLENGE_CODE_TTL_MS,
	CHALLENGE_MAX_ATTEMPTS,
	CHALLENGE_RESEND_COOLDOWN_MS,
	parseChallengeToken
} from './challenge';
import {
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
};

export type UpdateUserNames = {
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
	_tag: '@error/DuplicateUser';
	email: string;
};

export type AccountNotFound = {
	_tag: '@error/AccountNotFound';
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
	_tag: '@error/DuplicatePasskey';
	passkeyId: string;
};

export type PasskeyNotFound = {
	_tag: '@error/PasskeyNotFound';
	passkeyId: string;
};

export type UserPasskey = {
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	platformIcon: string | null;
	createdAt: number;
};

export type ChallengePurpose = 'login' | 'signup' | 'email-change';

export type Challenge = {
	id: string;
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
	failedAttempts: number;
	consumedAt: number | null;
	createdAt: number;
	codeExpiresAt: number;
	challengeExpiresAt: number;
};

export type CreatedChallenge = {
	_tag: 'CreatedChallenge';
	challenge: Challenge;
	token: string;
	code: string;
};

export type ChallengeRateLimited = {
	_tag: '@error/ChallengeRateLimited';
	retryAfterMs: number;
};

export type ChallengeVerificationError = {
	_tag: '@error/ChallengeVerificationError';
	code:
		| 'INVALID_CODE'
		| 'CODE_EXPIRED'
		| 'CHALLENGE_EXPIRED'
		| 'TOO_MANY_ATTEMPTS'
		| 'ACCOUNT_NOT_FOUND'
		| 'PURPOSE_MISMATCH'
		| 'UNAUTHORIZED';
	email?: string;
};

export type ConsumedChallenge = {
	_tag: 'ChallengeConsumed';
	user: SessionUser;
};

export type EmailChangeSuccess = {
	_tag: 'EmailChangeSuccess';
	user: SessionUser;
	oldEmail: string;
};

export type Session = {
	id: string;
	userId: number;
	createdAt: number;
	// when the session token was checked
	lastVerifiedAt: number;
	// when the last passkey based authentication took place
	passkeyAuthenticatedAt: number | null;
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

type VerifiedChallenge = {
	_tag: 'VerifiedChallenge';
	challenge: Challenge;
};

const isDuplicateUser = (user: SessionUser | DuplicateUser): user is DuplicateUser =>
	(user as DuplicateUser)._tag === '@error/DuplicateUser';

const isSqliteConstraintError = (e: unknown): e is DrizzleQueryError & { cause: LibsqlError } => {
	if (!(e instanceof DrizzleQueryError)) return false;
	if (!(e.cause instanceof LibsqlError)) return false;

	return (
		e.cause.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE' ||
		e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY'
	);
};

const challengeFromDbRow = (row: {
	id: string;
	purpose: string;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
	failedAttempts: number;
	consumedAt: number | null;
	createdAt: number;
	codeExpiresAt: number;
	challengeExpiresAt: number;
}): Challenge => ({
	...row,
	purpose: row.purpose as ChallengePurpose
});

const getChallengeByToken = async (token: string): Promise<Challenge | null> => {
	const parsedToken = parseChallengeToken(token);
	if (!parsedToken) return null;

	const rows = await db
		.select({
			id: challengesTable.id,
			purpose: challengesTable.purpose,
			userId: challengesTable.userId,
			email: challengesTable.email,
			givenName: challengesTable.givenName,
			familyName: challengesTable.familyName,
			failedAttempts: challengesTable.failedAttempts,
			consumedAt: challengesTable.consumedAt,
			createdAt: challengesTable.createdAt,
			codeExpiresAt: challengesTable.codeExpiresAt,
			challengeExpiresAt: challengesTable.challengeExpiresAt,
			secretHash: challengesTable.secretHash
		})
		.from(challengesTable)
		.where(eq(challengesTable.id, parsedToken.id))
		.limit(1);

	const row = rows[0];
	if (!row) return null;

	const suppliedSecretHash = hashText(parsedToken.secret);
	if (!isEqualHash(row.secretHash, suppliedSecretHash)) return null;

	return challengeFromDbRow(row);
};

const deleteExpiredChallenges = async (): Promise<void> => {
	await db.delete(challengesTable).where(lt(challengesTable.challengeExpiresAt, Date.now()));
};

const deleteChallengesByEmail = async (
	email: string,
	purpose: ChallengePurpose,
	excludeId?: string
): Promise<void> => {
	const now = Date.now();
	const where = excludeId
		? and(
				eq(challengesTable.email, email),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now),
				ne(challengesTable.id, excludeId)
			)
		: and(
				eq(challengesTable.email, email),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now)
			);

	await db.delete(challengesTable).where(where);
};

const deleteChallengesByUserId = async (
	userId: number,
	purpose: ChallengePurpose,
	excludeId?: string
): Promise<void> => {
	const now = Date.now();
	const where = excludeId
		? and(
				eq(challengesTable.userId, userId),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now),
				ne(challengesTable.id, excludeId)
			)
		: and(
				eq(challengesTable.userId, userId),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now)
			);

	await db.delete(challengesTable).where(where);
};

const getLatestChallengeByEmail = async (
	email: string,
	purpose: ChallengePurpose
): Promise<Challenge | null> => {
	const now = Date.now();
	const rows = await db
		.select({
			id: challengesTable.id,
			purpose: challengesTable.purpose,
			userId: challengesTable.userId,
			email: challengesTable.email,
			givenName: challengesTable.givenName,
			familyName: challengesTable.familyName,
			failedAttempts: challengesTable.failedAttempts,
			consumedAt: challengesTable.consumedAt,
			createdAt: challengesTable.createdAt,
			codeExpiresAt: challengesTable.codeExpiresAt,
			challengeExpiresAt: challengesTable.challengeExpiresAt
		})
		.from(challengesTable)
		.where(
			and(
				eq(challengesTable.email, email),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now)
			)
		)
		.orderBy(desc(challengesTable.createdAt))
		.limit(1);

	const row = rows[0];
	return row ? challengeFromDbRow(row) : null;
};

const getLatestChallengeByUserId = async (
	userId: number,
	purpose: ChallengePurpose
): Promise<Challenge | null> => {
	const now = Date.now();
	const rows = await db
		.select({
			id: challengesTable.id,
			purpose: challengesTable.purpose,
			userId: challengesTable.userId,
			email: challengesTable.email,
			givenName: challengesTable.givenName,
			familyName: challengesTable.familyName,
			failedAttempts: challengesTable.failedAttempts,
			consumedAt: challengesTable.consumedAt,
			createdAt: challengesTable.createdAt,
			codeExpiresAt: challengesTable.codeExpiresAt,
			challengeExpiresAt: challengesTable.challengeExpiresAt
		})
		.from(challengesTable)
		.where(
			and(
				eq(challengesTable.userId, userId),
				eq(challengesTable.purpose, purpose),
				isNull(challengesTable.consumedAt),
				gte(challengesTable.challengeExpiresAt, now)
			)
		)
		.orderBy(desc(challengesTable.createdAt))
		.limit(1);

	const row = rows[0];
	return row ? challengeFromDbRow(row) : null;
};

const insertChallenge = async (input: {
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<CreatedChallenge> => {
	for (let i = 0; i < 5; i++) {
		const challengeId = generateRandomString(CHALLENGE_ID_LENGTH);
		const challengeSecret = generateRandomString(CHALLENGE_SECRET_LENGTH);
		const token = `${challengeId}.${challengeSecret}`;
		const code = generateCode();
		const now = Date.now();

		try {
			await db.insert(challengesTable).values({
				id: challengeId,
				purpose: input.purpose,
				userId: input.userId,
				email: input.email,
				givenName: input.givenName,
				familyName: input.familyName,
				secretHash: hashText(challengeSecret),
				codeHash: hashText(code),
				failedAttempts: 0,
				consumedAt: null,
				createdAt: now,
				codeExpiresAt: now + CHALLENGE_CODE_TTL_MS,
				challengeExpiresAt: now + CHALLENGE_FLOW_TTL_MS
			});
		} catch (e) {
			if (isSqliteConstraintError(e) && e.cause.extendedCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
				continue;
			}

			throw e;
		}

		return {
			_tag: 'CreatedChallenge',
			challenge: {
				id: challengeId,
				purpose: input.purpose,
				userId: input.userId,
				email: input.email,
				givenName: input.givenName,
				familyName: input.familyName,
				failedAttempts: 0,
				consumedAt: null,
				createdAt: now,
				codeExpiresAt: now + CHALLENGE_CODE_TTL_MS,
				challengeExpiresAt: now + CHALLENGE_FLOW_TTL_MS
			},
			token,
			code
		};
	}

	throw new Error('Unable to create one-time-code challenge');
};

const createChallengeByEmail = async (input: {
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<CreatedChallenge | ChallengeRateLimited> => {
	await deleteExpiredChallenges();

	const existingChallenge = await getLatestChallengeByEmail(input.email, input.purpose);
	if (existingChallenge) {
		const retryAfterMs = CHALLENGE_RESEND_COOLDOWN_MS - (Date.now() - existingChallenge.createdAt);
		if (retryAfterMs > 0) {
			return { _tag: '@error/ChallengeRateLimited', retryAfterMs };
		}

		await deleteChallengesByEmail(input.email, input.purpose);
	}

	return insertChallenge(input);
};

const createChallengeByUserId = async (input: {
	purpose: ChallengePurpose;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<CreatedChallenge | ChallengeRateLimited> => {
	await deleteExpiredChallenges();

	const existingChallenge = await getLatestChallengeByUserId(input.userId, input.purpose);
	if (existingChallenge) {
		const retryAfterMs = CHALLENGE_RESEND_COOLDOWN_MS - (Date.now() - existingChallenge.createdAt);
		if (retryAfterMs > 0) {
			return { _tag: '@error/ChallengeRateLimited', retryAfterMs };
		}

		await deleteChallengesByUserId(input.userId, input.purpose);
	}

	return insertChallenge(input);
};

const markChallengeConsumed = async (challengeId: string): Promise<void> => {
	await db
		.update(challengesTable)
		.set({ consumedAt: Date.now() })
		.where(eq(challengesTable.id, challengeId));
};

const incrementChallengeFailures = async (
	challengeId: string,
	nextFailedAttempts: number
): Promise<void> => {
	await db
		.update(challengesTable)
		.set({ failedAttempts: nextFailedAttempts })
		.where(eq(challengesTable.id, challengeId));
};

const verifyChallenge = async (input: {
	token: string;
	code: string;
	purpose: ChallengePurpose;
}): Promise<VerifiedChallenge | ChallengeVerificationError> => {
	const challenge = await getChallengeByToken(input.token);
	if (!challenge) return { _tag: '@error/ChallengeVerificationError', code: 'CHALLENGE_EXPIRED' };
	if (challenge.purpose !== input.purpose) {
		return { _tag: '@error/ChallengeVerificationError', code: 'PURPOSE_MISMATCH' };
	}
	if (challenge.consumedAt !== null || Date.now() > challenge.challengeExpiresAt) {
		await db.delete(challengesTable).where(eq(challengesTable.id, challenge.id));
		return { _tag: '@error/ChallengeVerificationError', code: 'CHALLENGE_EXPIRED' };
	}
	if (challenge.failedAttempts >= CHALLENGE_MAX_ATTEMPTS) {
		return { _tag: '@error/ChallengeVerificationError', code: 'TOO_MANY_ATTEMPTS' };
	}
	if (Date.now() > challenge.codeExpiresAt) {
		return { _tag: '@error/ChallengeVerificationError', code: 'CODE_EXPIRED' };
	}

	const suppliedCodeHash = hashText(input.code);
	const storedChallenge = await db
		.select({ codeHash: challengesTable.codeHash })
		.from(challengesTable)
		.where(eq(challengesTable.id, challenge.id))
		.limit(1);

	const codeHash = storedChallenge[0]?.codeHash;
	if (!codeHash || !isEqualHash(codeHash, suppliedCodeHash)) {
		const nextFailedAttempts = challenge.failedAttempts + 1;
		await incrementChallengeFailures(challenge.id, nextFailedAttempts);
		return {
			_tag: '@error/ChallengeVerificationError',
			code: nextFailedAttempts >= CHALLENGE_MAX_ATTEMPTS ? 'TOO_MANY_ATTEMPTS' : 'INVALID_CODE'
		};
	}

	return { _tag: 'VerifiedChallenge', challenge };
};

export const createOrRefreshLoginChallenge = async (
	email: string
): Promise<CreatedChallenge | AccountNotFound | ChallengeRateLimited> => {
	const account = await getUserByEmail(email);
	if (!account) return { _tag: '@error/AccountNotFound', email };

	return createChallengeByEmail({
		purpose: 'login',
		userId: account.userId,
		email: account.email,
		givenName: account.givenName,
		familyName: account.familyName
	});
};

export const createOrRefreshSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<CreatedChallenge | DuplicateUser | ChallengeRateLimited> => {
	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount) return { _tag: '@error/DuplicateUser', email: input.email };

	return createChallengeByEmail({
		purpose: 'signup',
		userId: null,
		email: input.email,
		givenName: input.givenName,
		familyName: input.familyName
	});
};

export const createOrRefreshEmailChallenge = async (input: {
	userId: number;
	email: string;
}): Promise<CreatedChallenge | AccountNotFound | DuplicateUser | ChallengeRateLimited> => {
	const account = await getUserById(input.userId);
	if (!account) return { _tag: '@error/AccountNotFound', email: input.email };

	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: input.email };
	}

	return createChallengeByUserId({
		purpose: 'email-change',
		userId: account.userId,
		email: input.email,
		givenName: account.givenName,
		familyName: account.familyName
	});
};

export const getChallenge = async (token: string): Promise<Challenge | null> => {
	const challenge = await getChallengeByToken(token);
	if (!challenge) return null;
	if (challenge.consumedAt !== null) return null;
	if (Date.now() > challenge.challengeExpiresAt) {
		await db.delete(challengesTable).where(eq(challengesTable.id, challenge.id));
		return null;
	}

	return challenge;
};

const consumeChallengeByEmail = async (
	challenge: Challenge
): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const user = await getUserByEmail(challenge.email);
	if (!user) {
		return {
			_tag: '@error/ChallengeVerificationError',
			code: 'ACCOUNT_NOT_FOUND',
			email: challenge.email
		};
	}

	await markChallengeConsumed(challenge.id);
	await deleteChallengesByEmail(challenge.email, challenge.purpose, challenge.id);

	return { _tag: 'ChallengeConsumed', user };
};

export const consumeSignupChallenge = async (input: {
	token: string;
	code: string;
}): Promise<ConsumedChallenge | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		token: input.token,
		code: input.code,
		purpose: 'signup'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const givenName = challenge.givenName?.trim();
	const familyName = challenge.familyName?.trim();
	if (!givenName || !familyName) {
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}

	const createdUser = await createUser({
		email: challenge.email,
		givenName,
		familyName
	});

	if (createdUser._tag === '@error/DuplicateUser') {
		return createdUser;
	}

	return consumeChallengeByEmail(challenge);
};

export const consumeLoginChallenge = async (input: {
	token: string;
	code: string;
}): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		token: input.token,
		code: input.code,
		purpose: 'login'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	return consumeChallengeByEmail(verified.challenge);
};

export const consumeEmailChallenge = async (input: {
	token: string;
	code: string;
	userId: number;
}): Promise<EmailChangeSuccess | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		token: input.token,
		code: input.code,
		purpose: 'email-change'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;
	if (challenge.userId !== input.userId) {
		return { _tag: '@error/ChallengeVerificationError', code: 'UNAUTHORIZED' };
	}

	const currentAccount = await getUserById(input.userId);
	if (!currentAccount) {
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const updatedUser = await updateUserEmail(input.userId, challenge.email);
	if (!updatedUser) {
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}
	if (isDuplicateUser(updatedUser)) {
		return updatedUser;
	}

	await markChallengeConsumed(challenge.id);
	await deleteChallengesByUserId(input.userId, challenge.purpose, challenge.id);

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};

export const createUser = async (newUser: CreateUser): Promise<User | DuplicateUser> => {
	const { email, givenName, familyName } = newUser;

	try {
		const createdAt = Date.now();
		const user = await db
			.insert(usersTable)
			.values({ email, givenName, familyName, createdAt })
			.returning({ userId: usersTable.id, createdAt: usersTable.createdAt });

		return { _tag: 'User', userId: user[0].userId, email, createdAt: user[0].createdAt };
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: '@error/DuplicateUser', email };
	}
};

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

	return users[0] ?? null;
};

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

	return users[0] ?? null;
};

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

	return users[0] ?? null;
};

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

		return users[0] ?? null;
	} catch (e) {
		if (!isSqliteConstraintError(e) || e.cause.extendedCode !== 'SQLITE_CONSTRAINT_UNIQUE') throw e;
		return { _tag: '@error/DuplicateUser', email };
	}
};

export const deleteUser = async (userId: number): Promise<boolean> => {
	return await db.transaction(async (tx) => {
		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
		await tx.delete(passkeysTable).where(eq(passkeysTable.userId, userId));
		await tx.delete(challengesTable).where(eq(challengesTable.userId, userId));

		const deletedUsers = await tx
			.delete(usersTable)
			.where(eq(usersTable.id, userId))
			.returning({ userId: usersTable.id });

		return Boolean(deletedUsers[0]);
	});
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
		return { _tag: '@error/DuplicatePasskey', passkeyId };
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
			session: {
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
			passkeyAuthenticatedAt: sessionsTable.passkeyAuthenticatedAt,
			email: usersTable.email,
			givenName: usersTable.givenName,
			familyName: usersTable.familyName
		})
		.from(sessionsTable)
		.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
		.where(eq(sessionsTable.id, sessionToken.id))
		.limit(1);

	const row = result[0];
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
		session: {
			id: row.sessionId,
			userId: row.userId,
			createdAt: row.createdAt,
			passkeyAuthenticatedAt: row.passkeyAuthenticatedAt,
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

export const refreshPasskeyAuthenticatedAt = async (sessionId: string): Promise<void> => {
	await db
		.update(sessionsTable)
		.set({ passkeyAuthenticatedAt: Date.now() })
		.where(eq(sessionsTable.id, sessionId));
};

export const invalidateSession = async (sessionId: string): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
};

export const invalidateSessionsByUserId = async (userId: number): Promise<void> => {
	await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
};

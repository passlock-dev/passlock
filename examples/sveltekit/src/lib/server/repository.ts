/**
 * DrizzleORM based repository
 */

import { DrizzleQueryError } from 'drizzle-orm/errors';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { LibsqlError } from '@libsql/client';
import db from './db';
import {
	passkeysTable,
	sessionsTable,
	signupChallengesTable,
	userChallengesTable,
	usersTable
} from './dbSchema';
import { hashText, isEqualHash } from './hashing';
import { CHALLENGE_FLOW_TTL_MS } from './challenge';
import {
	createMailboxChallenge as createPasslockMailboxChallenge,
	type ChallengeRateLimitedError,
	isChallengeRateLimitedError,
	verifyMailboxChallenge as verifyPasslockMailboxChallenge
} from './passlock';
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
type UserChallengePurpose = Exclude<ChallengePurpose, 'signup'>;

export type Challenge = {
	id: string;
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
	createdAt: number;
	challengeExpiresAt: number;
};

export type CreatedChallenge = {
	_tag: 'CreatedChallenge';
	challenge: Challenge;
	token: string;
	code: string;
};

type ChallengeCreationResult = CreatedChallenge | ChallengeRateLimitedError;

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

const userChallengeFromDbRow = (row: {
	id: string;
	purpose: string;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
	createdAt: number;
	challengeExpiresAt: number;
}): Challenge => ({
	...row,
	purpose: row.purpose as ChallengePurpose
});

const signupChallengeFromDbRow = (row: {
	id: string;
	email: string;
	givenName: string;
	familyName: string;
	createdAt: number;
	challengeExpiresAt: number;
}): Challenge => ({
	...row,
	purpose: 'signup',
	userId: null
});

const userChallengeSelect = {
	id: userChallengesTable.challengeId,
	purpose: userChallengesTable.purpose,
	userId: userChallengesTable.userId,
	email: userChallengesTable.email,
	givenName: usersTable.givenName,
	familyName: usersTable.familyName,
	createdAt: userChallengesTable.createdAt,
	challengeExpiresAt: userChallengesTable.challengeExpiresAt
};

const signupChallengeSelect = {
	id: signupChallengesTable.challengeId,
	email: signupChallengesTable.email,
	givenName: signupChallengesTable.givenName,
	familyName: signupChallengesTable.familyName,
	createdAt: signupChallengesTable.createdAt,
	challengeExpiresAt: signupChallengesTable.challengeExpiresAt
};

const uniqueChallengeIds = (challengeIds: string[]) => [...new Set(challengeIds)];

const deleteChallenges = async (challengeIds: string[]): Promise<void> => {
	const uniqueIds = uniqueChallengeIds(challengeIds);
	if (uniqueIds.length === 0) return;

	await db.transaction(async (tx) => {
		await tx.delete(userChallengesTable).where(inArray(userChallengesTable.challengeId, uniqueIds));

		await tx
			.delete(signupChallengesTable)
			.where(inArray(signupChallengesTable.challengeId, uniqueIds));
	});
};

const getUnexpiredChallenge = async (challenge: Challenge | null): Promise<Challenge | null> => {
	if (!challenge) return null;

	if (Date.now() > challenge.challengeExpiresAt) {
		await deleteChallenges([challenge.id]);
		return null;
	}

	return challenge;
};

const getPendingUserChallenge = async (
	challengeId: string,
	purpose: UserChallengePurpose
): Promise<Challenge | null> => {
	const userRows = await db
		.select(userChallengeSelect)
		.from(userChallengesTable)
		.leftJoin(usersTable, eq(usersTable.id, userChallengesTable.userId))
		.where(
			and(
				eq(userChallengesTable.challengeId, challengeId),
				eq(userChallengesTable.purpose, purpose)
			)
		)
		.limit(1);

	const userRow = userRows[0];
	return getUnexpiredChallenge(userRow ? userChallengeFromDbRow(userRow) : null);
};

export const getPendingLoginChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingUserChallenge(challengeId, 'login');

export const getPendingEmailChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingUserChallenge(challengeId, 'email-change');

export const getPendingSignupChallenge = async (challengeId: string): Promise<Challenge | null> => {
	const signupRows = await db
		.select(signupChallengeSelect)
		.from(signupChallengesTable)
		.where(eq(signupChallengesTable.challengeId, challengeId))
		.limit(1);

	const signupRow = signupRows[0];
	return getUnexpiredChallenge(signupRow ? signupChallengeFromDbRow(signupRow) : null);
};

const deleteExpiredUserChallenges = async (userId: number): Promise<void> => {
	const rows = await db
		.select({ id: userChallengesTable.challengeId })
		.from(userChallengesTable)
		.where(
			and(
				eq(userChallengesTable.userId, userId),
				lt(userChallengesTable.challengeExpiresAt, Date.now())
			)
		);

	await deleteChallenges(rows.map((challenge) => challenge.id));
};

const deleteExpiredSignupChallenges = async (email: string): Promise<void> => {
	const rows = await db
		.select({ id: signupChallengesTable.challengeId })
		.from(signupChallengesTable)
		.where(
			and(
				eq(signupChallengesTable.email, email),
				lt(signupChallengesTable.challengeExpiresAt, Date.now())
			)
		);

	await deleteChallenges(rows.map((challenge) => challenge.id));
};

const deleteChallengesByEmail = async (
	email: string,
	purpose: ChallengePurpose,
	options?: { excludeChallengeIds?: string[] }
): Promise<void> => {
	const rows =
		purpose === 'signup'
			? await db
					.select({ id: signupChallengesTable.challengeId })
					.from(signupChallengesTable)
					.where(eq(signupChallengesTable.email, email))
			: await db
					.select({ id: userChallengesTable.challengeId })
					.from(userChallengesTable)
					.where(
						and(eq(userChallengesTable.email, email), eq(userChallengesTable.purpose, purpose))
					);

	const excludeChallengeIds = new Set(options?.excludeChallengeIds ?? []);
	await deleteChallenges(
		rows
			.map((challenge) => challenge.id)
			.filter((challengeId) => !excludeChallengeIds.has(challengeId))
	);
};

const deleteChallengesByUserId = async (
	userId: number,
	purpose: UserChallengePurpose,
	options?: { excludeChallengeIds?: string[] }
): Promise<void> => {
	const rows = await db
		.select({ id: userChallengesTable.challengeId })
		.from(userChallengesTable)
		.where(and(eq(userChallengesTable.userId, userId), eq(userChallengesTable.purpose, purpose)));

	const excludeChallengeIds = new Set(options?.excludeChallengeIds ?? []);
	await deleteChallenges(
		rows
			.map((challenge) => challenge.id)
			.filter((challengeId) => !excludeChallengeIds.has(challengeId))
	);
};

const insertSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<ChallengeCreationResult> => {
	const givenName = input.givenName.trim();
	const familyName = input.familyName.trim();
	if (!givenName || !familyName) {
		throw new Error('Signup challenge requires given and family names');
	}

	const challengeExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'signup'
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	await db.insert(signupChallengesTable).values({
		challengeId: challenge.id,
		email: input.email,
		createdAt: challenge.createdAt,
		challengeExpiresAt,
		givenName,
		familyName
	});

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			id: challenge.id,
			purpose: 'signup',
			userId: null,
			email: input.email,
			givenName,
			familyName,
			createdAt: challenge.createdAt,
			challengeExpiresAt
		},
		token: challenge.token,
		code: challenge.code
	};
};

const insertUserChallenge = async (input: {
	purpose: UserChallengePurpose;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<ChallengeCreationResult> => {
	const givenName = input.givenName?.trim() ?? null;
	const familyName = input.familyName?.trim() ?? null;
	const challengeExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: input.purpose,
		userId: input.userId
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	await db.insert(userChallengesTable).values({
		challengeId: challenge.id,
		purpose: input.purpose,
		userId: input.userId,
		email: input.email,
		createdAt: challenge.createdAt,
		challengeExpiresAt
	});

	return {
		_tag: 'CreatedChallenge',
		challenge: {
			id: challenge.id,
			purpose: input.purpose,
			userId: input.userId,
			email: input.email,
			givenName,
			familyName,
			createdAt: challenge.createdAt,
			challengeExpiresAt
		},
		token: challenge.token,
		code: challenge.code
	};
};

const createChallengeByEmail = async (input: {
	purpose: ChallengePurpose;
	userId: number | null;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<ChallengeCreationResult> => {
	if (input.purpose === 'signup') {
		await deleteExpiredSignupChallenges(input.email);

		const challenge = await insertSignupChallenge({
			email: input.email,
			givenName: input.givenName ?? '',
			familyName: input.familyName ?? ''
		});
		if (challenge._tag !== 'CreatedChallenge') return challenge;

		await deleteChallengesByEmail(input.email, input.purpose, {
			excludeChallengeIds: [challenge.challenge.id]
		});

		return challenge;
	}

	if (input.userId === null) {
		throw new Error('User challenge requires a user id');
	}

	await deleteExpiredUserChallenges(input.userId);

	const challenge = await insertUserChallenge({
		purpose: input.purpose,
		userId: input.userId,
		email: input.email,
		givenName: input.givenName,
		familyName: input.familyName
	});
	if (challenge._tag !== 'CreatedChallenge') return challenge;

	await deleteChallengesByEmail(input.email, input.purpose, {
		excludeChallengeIds: [challenge.challenge.id]
	});

	return challenge;
};

const createChallengeByUserId = async (input: {
	purpose: UserChallengePurpose;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<ChallengeCreationResult> => {
	await deleteExpiredUserChallenges(input.userId);

	const challenge = await insertUserChallenge(input);
	if (challenge._tag !== 'CreatedChallenge') return challenge;

	await deleteChallengesByUserId(input.userId, input.purpose, {
		excludeChallengeIds: [challenge.challenge.id]
	});

	return challenge;
};

const verifyChallenge = async (input: {
	challengeId: string;
	token: string;
	code: string;
	purpose: ChallengePurpose;
}): Promise<VerifiedChallenge | ChallengeVerificationError> => {
	const challenge =
		input.purpose === 'signup'
			? await getPendingSignupChallenge(input.challengeId)
			: input.purpose === 'login'
				? await getPendingLoginChallenge(input.challengeId)
				: await getPendingEmailChallenge(input.challengeId);
	if (!challenge) return { _tag: '@error/ChallengeVerificationError', code: 'CHALLENGE_EXPIRED' };

	const result = await verifyPasslockMailboxChallenge({
		token: input.token,
		code: input.code
	});

	if (result.success) {
		return { _tag: 'VerifiedChallenge', challenge };
	}

	switch (result._tag) {
		case '@error/InvalidChallenge':
			await deleteChallenges([challenge.id]);
			return { _tag: '@error/ChallengeVerificationError', code: 'CHALLENGE_EXPIRED' };
		case '@error/InvalidChallengeCode':
			return { _tag: '@error/ChallengeVerificationError', code: 'INVALID_CODE' };
		case '@error/ChallengeAttemptsExceeded':
			return { _tag: '@error/ChallengeVerificationError', code: 'TOO_MANY_ATTEMPTS' };
		case '@error/ChallengeExpired':
			return { _tag: '@error/ChallengeVerificationError', code: 'CODE_EXPIRED' };
		case '@error/Forbidden':
			console.error('Unable to verify mailbox challenge', result);
			throw new Error('Unable to verify one-time code challenge');
	}

	throw new Error('Unexpected mailbox challenge verification result');
};

export const createOrRefreshLoginChallenge = async (
	email: string
): Promise<CreatedChallenge | AccountNotFound | ChallengeRateLimitedError> => {
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
}): Promise<CreatedChallenge | DuplicateUser | ChallengeRateLimitedError> => {
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
}): Promise<CreatedChallenge | AccountNotFound | DuplicateUser | ChallengeRateLimitedError> => {
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

const consumeChallengeByEmail = async (
	challenge: Challenge
): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const user = await getUserByEmail(challenge.email);
	if (!user) {
		await deleteChallenges([challenge.id]);
		return {
			_tag: '@error/ChallengeVerificationError',
			code: 'ACCOUNT_NOT_FOUND',
			email: challenge.email
		};
	}

	await deleteChallenges([challenge.id]);

	return { _tag: 'ChallengeConsumed', user };
};

export const consumeSignupChallenge = async (input: {
	challengeId: string;
	token: string;
	code: string;
}): Promise<ConsumedChallenge | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		token: input.token,
		code: input.code,
		purpose: 'signup'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const givenName = challenge.givenName?.trim();
	const familyName = challenge.familyName?.trim();
	if (!givenName || !familyName) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}

	const createdUser = await createUser({
		email: challenge.email,
		givenName,
		familyName
	});

	if (createdUser._tag === '@error/DuplicateUser') {
		await deleteChallenges([challenge.id]);
		return createdUser;
	}

	return consumeChallengeByEmail(challenge);
};

export const consumeLoginChallenge = async (input: {
	challengeId: string;
	token: string;
	code: string;
}): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		token: input.token,
		code: input.code,
		purpose: 'login'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	return consumeChallengeByEmail(verified.challenge);
};

export const consumeEmailChallenge = async (input: {
	challengeId: string;
	token: string;
	code: string;
	userId: number;
}): Promise<EmailChangeSuccess | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		token: input.token,
		code: input.code,
		purpose: 'email-change'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;
	if (challenge.userId !== input.userId) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/ChallengeVerificationError', code: 'UNAUTHORIZED' };
	}

	const currentAccount = await getUserById(input.userId);
	if (!currentAccount) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const updatedUser = await updateUserEmail(input.userId, challenge.email);
	if (!updatedUser) {
		await deleteChallenges([challenge.id]);
		return { _tag: '@error/ChallengeVerificationError', code: 'ACCOUNT_NOT_FOUND' };
	}
	if (isDuplicateUser(updatedUser)) {
		await deleteChallenges([challenge.id]);
		return updatedUser;
	}

	await deleteChallenges([challenge.id]);

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
		await tx
			.select({ id: userChallengesTable.challengeId })
			.from(userChallengesTable)
			.where(eq(userChallengesTable.userId, userId));

		await tx.delete(userChallengesTable).where(eq(userChallengesTable.userId, userId));
		await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
		await tx.delete(passkeysTable).where(eq(passkeysTable.userId, userId));

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

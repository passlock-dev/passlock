/**
 * Repository layer for the example app's local account, session, challenge,
 * and passkey state.
 *
 * Passlock remains responsible for verifying mailbox challenges and passkey
 * proofs. This module translates those verified results into local records the
 * SvelteKit app can use for routing, UI, and authorization decisions.
 */

import { DrizzleQueryError } from 'drizzle-orm/errors';
import { and, desc, eq } from 'drizzle-orm';
import { LibsqlError } from '@libsql/client';
import db from './db';
import { passkeysTable, sessionsTable, usersTable } from './dbSchema';
import { hashText, isEqualHash } from './hashing';
import { CHALLENGE_FLOW_TTL_MS } from './cookies';
import {
	createMailboxChallenge as createPasslockMailboxChallenge,
	getMailboxChallenge as getPasslockMailboxChallenge,
	type ChallengeRateLimitedError,
	type MailboxChallenge,
	type MailboxChallengeDetails,
	type MailboxChallengeMetadata,
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
 * Passkey metadata shown in account-management UI.
 */
export type UserPasskey = {
	passkeyId: string;
	username: string | null;
	platformName: string | null;
	platformIcon: string | null;
	createdAt: number;
};

export type ChallengePurpose = 'login' | 'signup' | 'email-change';
type UserChallengePurpose = Exclude<ChallengePurpose, 'signup'>;

/**
 * Normalized mailbox challenge shape used by the app after reading from
 * Passlock.
 */
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

/**
 * Challenge plus the secret and code needed to complete the current flow.
 */
export type CreatedChallenge = {
	_tag: 'CreatedChallenge';
	challenge: Challenge;
	secret: string;
	code: string;
};

type ChallengeCreationResult = CreatedChallenge | ChallengeRateLimitedError;

/**
 * Application-level failure reasons for one-time-code verification.
 *
 * These collapse Passlock SDK errors plus local authorization checks into a
 * smaller set that route handlers can map to redirects and field errors.
 */
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

/**
 * Returned when a challenge successfully identifies a local account.
 */
export type ConsumedChallenge = {
	_tag: 'ChallengeConsumed';
	user: SessionUser;
};

/**
 * Returned when an email-change challenge has been verified and applied.
 */
export type EmailChangeSuccess = {
	_tag: 'EmailChangeSuccess';
	user: SessionUser;
	oldEmail: string;
};

/**
 * Server-side session record stored in SQLite.
 */
export type Session = {
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
	userId: number;
	email: string;
	givenName: string;
	familyName: string;
};

/**
 * Result of validating a session cookie against the local database.
 */
export type SessionValidationResult = {
	session: Session;
	user: SessionUser;
	fresh: boolean;
};

/**
 * Newly created session plus the opaque token sent to the browser cookie.
 */
export type CreatedSession = {
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

type ValidatedChallengeMetadata = {
	challengeExpiresAt: number;
	givenName: string | null;
	familyName: string | null;
};

type ValidatedChallenge = {
	_tag: 'ValidatedChallenge';
	challenge: Challenge;
};

const createChallengeVerificationError = (
	code: ChallengeVerificationError['code'],
	email?: string
): ChallengeVerificationError => ({
	_tag: '@error/ChallengeVerificationError',
	code,
	email
});

const isMailboxChallengeMetadataRecord = (
	metadata: MailboxChallengeDetails['metadata']
): metadata is MailboxChallengeMetadata =>
	typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata);

const parseChallengeExpiresAt = (metadata: MailboxChallengeMetadata): number | null => {
	const value = metadata.challengeExpiresAt;
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const parseChallengeName = (
	metadata: MailboxChallengeMetadata,
	key: 'givenName' | 'familyName'
): string | null => {
	const value = metadata[key];
	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	return trimmed || null;
};

const parseChallengeMetadata = (
	purpose: ChallengePurpose,
	metadata: MailboxChallengeDetails['metadata']
): ValidatedChallengeMetadata | null => {
	if (!isMailboxChallengeMetadataRecord(metadata)) return null;

	const challengeExpiresAt = parseChallengeExpiresAt(metadata);
	if (challengeExpiresAt === null) return null;

	if (purpose !== 'signup') {
		return {
			challengeExpiresAt,
			givenName: null,
			familyName: null
		};
	}

	const givenName = parseChallengeName(metadata, 'givenName');
	const familyName = parseChallengeName(metadata, 'familyName');
	if (!givenName || !familyName) return null;

	return {
		challengeExpiresAt,
		givenName,
		familyName
	};
};

const parseChallengeUserId = (userId: string | undefined): number | null => {
	if (!userId || !/^\d+$/.test(userId)) return null;

	const parsed = Number(userId);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;

	return parsed;
};

const toChallenge = (input: {
	challenge: MailboxChallengeDetails;
	purpose: ChallengePurpose;
	expectedUserId?: number | undefined;
}): ValidatedChallenge | ChallengeVerificationError => {
	if (input.challenge.purpose !== input.purpose) {
		return createChallengeVerificationError('PURPOSE_MISMATCH');
	}

	const metadata = parseChallengeMetadata(input.purpose, input.challenge.metadata);
	if (!metadata) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (Date.now() > metadata.challengeExpiresAt) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	const userId = input.purpose === 'signup' ? null : parseChallengeUserId(input.challenge.userId);
	if (input.purpose !== 'signup' && userId === null) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
	}

	if (input.expectedUserId !== undefined && userId !== null && userId !== input.expectedUserId) {
		return createChallengeVerificationError('UNAUTHORIZED');
	}

	return {
		_tag: 'ValidatedChallenge',
		challenge: {
			id: input.challenge.challengeId,
			purpose: input.purpose,
			userId,
			email: input.challenge.email,
			givenName: metadata.givenName,
			familyName: metadata.familyName,
			createdAt: input.challenge.createdAt,
			challengeExpiresAt: metadata.challengeExpiresAt
		}
	};
};

const toCreatedChallenge = (input: {
	challenge: MailboxChallenge;
	purpose: ChallengePurpose;
	userId: number | null;
	givenName: string | null;
	familyName: string | null;
	challengeExpiresAt: number;
}): CreatedChallenge => ({
	_tag: 'CreatedChallenge',
	challenge: {
		id: input.challenge.challengeId,
		purpose: input.purpose,
		userId: input.userId,
		email: input.challenge.email,
		givenName: input.givenName,
		familyName: input.familyName,
		createdAt: input.challenge.createdAt,
		challengeExpiresAt: input.challengeExpiresAt
	},
	secret: input.challenge.secret,
	code: input.challenge.code
});

const createSignupChallenge = async (input: {
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
	const metadata: MailboxChallengeMetadata = {
		challengeExpiresAt,
		givenName,
		familyName
	};
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: 'signup',
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return toCreatedChallenge({
		challenge,
		purpose: 'signup',
		userId: null,
		givenName,
		familyName,
		challengeExpiresAt
	});
};

const createUserChallenge = async (input: {
	purpose: UserChallengePurpose;
	userId: number;
	email: string;
	givenName: string | null;
	familyName: string | null;
}): Promise<ChallengeCreationResult> => {
	const challengeExpiresAt = Date.now() + CHALLENGE_FLOW_TTL_MS;
	const metadata: MailboxChallengeMetadata = {
		challengeExpiresAt
	};
	const challenge = await createPasslockMailboxChallenge({
		email: input.email,
		purpose: input.purpose,
		userId: input.userId,
		metadata,
		invalidateOthers: true
	});
	if (isChallengeRateLimitedError(challenge)) return challenge;

	return toCreatedChallenge({
		challenge,
		purpose: input.purpose,
		userId: input.userId,
		givenName: input.givenName?.trim() ?? null,
		familyName: input.familyName?.trim() ?? null,
		challengeExpiresAt
	});
};

const getPendingChallenge = async (
	challengeId: string,
	purpose: ChallengePurpose
): Promise<Challenge | null> => {
	const challenge = await getPasslockMailboxChallenge({ challengeId });
	if (!challenge) return null;

	const validated = toChallenge({ challenge, purpose });
	return validated._tag === 'ValidatedChallenge' ? validated.challenge : null;
};

/**
 * Read a pending login challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingLoginChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'login');

/**
 * Read a pending email-change challenge if it still exists and still matches
 * the expected purpose.
 */
export const getPendingEmailChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'email-change');

/**
 * Read a pending signup challenge if it still exists and still matches the
 * expected purpose.
 */
export const getPendingSignupChallenge = async (challengeId: string): Promise<Challenge | null> =>
	getPendingChallenge(challengeId, 'signup');

const verifyChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
	purpose: ChallengePurpose;
	expectedUserId?: number | undefined;
}): Promise<VerifiedChallenge | ChallengeVerificationError> => {
	const result = await verifyPasslockMailboxChallenge({
		challengeId: input.challengeId,
		code: input.code,
		secret: input.secret
	});

	if (result.success) {
		const validated = toChallenge({
			challenge: result.challenge,
			purpose: input.purpose,
			expectedUserId: input.expectedUserId
		});
		if (validated._tag !== 'ValidatedChallenge') return validated;

		return { _tag: 'VerifiedChallenge', challenge: validated.challenge };
	}

	switch (result._tag) {
		case '@error/InvalidChallenge':
			return createChallengeVerificationError('CHALLENGE_EXPIRED');
		case '@error/InvalidChallengeCode':
			return createChallengeVerificationError('INVALID_CODE');
		case '@error/ChallengeAttemptsExceeded':
			return createChallengeVerificationError('TOO_MANY_ATTEMPTS');
		case '@error/ChallengeExpired':
			return createChallengeVerificationError('CODE_EXPIRED');
		case '@error/Forbidden':
			console.error('Unable to verify mailbox challenge', result);
			throw new Error('Unable to verify one-time code challenge');
	}

	throw new Error('Unexpected mailbox challenge verification result');
};

/**
 * Create or refresh the login one-time-code challenge for an existing account.
 */
export const createOrRefreshLoginChallenge = async (
	email: string
): Promise<CreatedChallenge | AccountNotFound | ChallengeRateLimitedError> => {
	const account = await getUserByEmail(email);
	if (!account) return { _tag: '@error/AccountNotFound', email };

	return createUserChallenge({
		purpose: 'login',
		userId: account.userId,
		email: account.email,
		givenName: account.givenName,
		familyName: account.familyName
	});
};

/**
 * Create or refresh the signup one-time-code challenge for a new account.
 */
export const createOrRefreshSignupChallenge = async (input: {
	email: string;
	givenName: string;
	familyName: string;
}): Promise<CreatedChallenge | DuplicateUser | ChallengeRateLimitedError> => {
	const existingAccount = await getUserByEmail(input.email);
	if (existingAccount) return { _tag: '@error/DuplicateUser', email: input.email };

	return createSignupChallenge(input);
};

/**
 * Create or refresh the challenge that verifies ownership of a replacement
 * email address for an existing account.
 */
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

	return createUserChallenge({
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
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND', challenge.email);
	}

	return { _tag: 'ChallengeConsumed', user };
};

/**
 * Verify a signup code, create the local account if needed, and resolve to
 * the new session user.
 */
export const consumeSignupChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<ConsumedChallenge | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'signup'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const givenName = challenge.givenName;
	const familyName = challenge.familyName;
	if (!givenName || !familyName) {
		return createChallengeVerificationError('CHALLENGE_EXPIRED');
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

/**
 * Verify a login code and resolve it to the existing local account.
 */
export const consumeLoginChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
}): Promise<ConsumedChallenge | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'login'
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	return consumeChallengeByEmail(verified.challenge);
};

/**
 * Verify an email-change code, ensure it belongs to the signed-in user, and
 * update the local account email address.
 */
export const consumeEmailChallenge = async (input: {
	challengeId: string;
	secret: string;
	code: string;
	userId: number;
}): Promise<EmailChangeSuccess | DuplicateUser | ChallengeVerificationError> => {
	const verified = await verifyChallenge({
		challengeId: input.challengeId,
		secret: input.secret,
		code: input.code,
		purpose: 'email-change',
		expectedUserId: input.userId
	});
	if (verified._tag !== 'VerifiedChallenge') return verified;

	const { challenge } = verified;

	const currentAccount = await getUserById(input.userId);
	if (!currentAccount) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND');
	}

	const existingAccount = await getUserByEmail(challenge.email);
	if (existingAccount && existingAccount.userId !== input.userId) {
		return { _tag: '@error/DuplicateUser', email: challenge.email };
	}

	const updatedUser = await updateUserEmail(input.userId, challenge.email);
	if (!updatedUser) {
		return createChallengeVerificationError('ACCOUNT_NOT_FOUND');
	}
	if (isDuplicateUser(updatedUser)) {
		return updatedUser;
	}

	return {
		_tag: 'EmailChangeSuccess',
		user: updatedUser,
		oldEmail: currentAccount.email
	};
};

/**
 * Create a local user record after signup has been verified by Passlock.
 */
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

	return users[0] ?? null;
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

	return users[0] ?? null;
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

	return users[0] ?? null;
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

		return users[0] ?? null;
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
 * List the passkeys linked to a local user for account-management UI.
 */
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

/**
 * Find passkeys by username/email so the passkey login route can pre-select
 * credentials for a known account.
 */
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

/**
 * Update the locally stored username for every passkey linked to a user.
 */
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

/**
 * Validate an opaque session token against the local session store and return
 * the corresponding user/session for `event.locals`.
 */
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

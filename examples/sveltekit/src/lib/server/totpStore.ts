import { and, eq, gt, lt, ne, sql } from 'drizzle-orm';
import type db from './db';
import {
	pendingTotpLoginsTable as logins,
	totpAuthenticatorsTable as authenticators
} from './dbSchema';
import { hashText } from './hashing';
import { generateRandomString } from './utils';
import { createSessionRecord } from './sessionRecord';

export const PENDING_LOGIN_TTL_MS = 5 * 60 * 1000;
export const PENDING_LOGIN_ATTEMPTS = 5;
export type LocalTotpAuthenticator = typeof authenticators.$inferSelect;

/** SQLite stores only ownership, lifecycle metadata and hashed, short-lived login tokens. */
export const createTotpStore = (database: typeof db, now = Date.now) => {
	const list = (userId: number) =>
		database.select().from(authenticators).where(eq(authenticators.userId, userId));
	const get = async (userId: number, id: string) =>
		(
			await database
				.select()
				.from(authenticators)
				.where(and(eq(authenticators.userId, userId), eq(authenticators.authenticatorId, id)))
		)[0];
	const pending = async (token: string) =>
		(
			await database
				.select()
				.from(logins)
				.where(
					and(
						eq(logins.tokenHash, hashText(token)),
						gt(logins.expiresAt, now()),
						lt(logins.attempts, PENDING_LOGIN_ATTEMPTS)
					)
				)
		)[0];
	return {
		list,
		get,
		pending,
		insert: (record: LocalTotpAuthenticator) => database.insert(authenticators).values(record),
		claimEnrollment: async (userId: number, id: string, sessionId: string) =>
			(
				await database
					.update(authenticators)
					.set({ status: 'confirming' })
					.where(
						and(
							eq(authenticators.userId, userId),
							eq(authenticators.authenticatorId, id),
							eq(authenticators.enrollmentSessionId, sessionId),
							eq(authenticators.status, 'pending'),
							gt(authenticators.expiresAt, now())
						)
					)
					.returning()
			)[0],
		restoreEnrollment: (userId: number, id: string) =>
			database
				.update(authenticators)
				.set({ status: 'pending' })
				.where(
					and(
						eq(authenticators.userId, userId),
						eq(authenticators.authenticatorId, id),
						eq(authenticators.status, 'confirming')
					)
				),
		activate: (userId: number, id: string) =>
			database.transaction(async (tx) => {
				const result = await tx
					.update(authenticators)
					.set({ status: 'active' })
					.where(and(eq(authenticators.userId, userId), eq(authenticators.authenticatorId, id)))
					.returning();
				// Old pending logins must not use a stale policy/credential snapshot.
				await tx.delete(logins).where(eq(logins.userId, userId));
				return result[0];
			}),
		remove: (userId: number, id: string) =>
			database.transaction(async (tx) => {
				await tx
					.delete(authenticators)
					.where(and(eq(authenticators.userId, userId), eq(authenticators.authenticatorId, id)));
				await tx.delete(logins).where(eq(logins.userId, userId));
			}),
		/** Decide email-login policy and issue its token in one transaction. */
		beginEmailLogin: (userId: number) =>
			database.transaction(async (tx) => {
				await tx.delete(logins).where(lt(logins.expiresAt, now()));
				const required = await tx
					.select()
					.from(authenticators)
					.where(and(eq(authenticators.userId, userId), ne(authenticators.status, 'pending')));
				await tx.delete(logins).where(eq(logins.userId, userId));
				if (required.length === 0)
					return { kind: 'session' as const, ...(await createSessionRecord(tx, userId)) };
				const token = generateRandomString(48);
				const expiresAt = now() + PENDING_LOGIN_TTL_MS;
				await tx.insert(logins).values({
					tokenHash: hashText(token),
					userId,
					authenticatorIds: required
						.filter((row) => row.status === 'active')
						.map((row) => row.authenticatorId),
					expiresAt
				});
				return { kind: 'pending' as const, token, expiresAt };
			}),
		claimLogin: async (token: string) =>
			(
				await database
					.update(logins)
					.set({ state: 'verifying', attempts: sql`${logins.attempts} + 1` })
					.where(
						and(
							eq(logins.tokenHash, hashText(token)),
							eq(logins.state, 'ready'),
							gt(logins.expiresAt, now()),
							lt(logins.attempts, PENDING_LOGIN_ATTEMPTS)
						)
					)
					.returning()
			)[0],
		releaseLogin: (token: string) =>
			database
				.update(logins)
				.set({ state: 'ready' })
				.where(eq(logins.tokenHash, hashText(token))),
		cancelLogin: (token: string) =>
			database.delete(logins).where(eq(logins.tokenHash, hashText(token))),
		/** A consumed or expired pending login can never mint another session. */
		finishLogin: (token: string, authenticatorId: string) =>
			database.transaction(async (tx) => {
				const row = (
					await tx
						.select()
						.from(logins)
						.where(
							and(
								eq(logins.tokenHash, hashText(token)),
								eq(logins.state, 'verifying'),
								gt(logins.expiresAt, now())
							)
						)
				)[0];
				if (!row || !row.authenticatorIds.includes(authenticatorId)) return null;
				const owned = (
					await tx
						.select()
						.from(authenticators)
						.where(
							and(
								eq(authenticators.userId, row.userId),
								eq(authenticators.authenticatorId, authenticatorId),
								eq(authenticators.status, 'active')
							)
						)
				)[0];
				if (!owned) return null;
				const deleted = await tx
					.delete(logins)
					.where(
						and(
							eq(logins.tokenHash, row.tokenHash),
							eq(logins.state, 'verifying'),
							gt(logins.expiresAt, now())
						)
					)
					.returning();
				if (!deleted[0]) return null;
				return createSessionRecord(tx, row.userId, { totpVerified: true });
			})
	};
};
export type TotpStore = ReturnType<typeof createTotpStore>;

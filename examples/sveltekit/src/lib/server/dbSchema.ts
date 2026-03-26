import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
	id: int().primaryKey({ autoIncrement: true }),
	email: text().notNull().unique(),
	givenName: text().notNull(),
	familyName: text().notNull(),
	createdAt: int().notNull()
});

export const passkeysTable = sqliteTable(
	'passkeys',
	{
		userId: int()
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		passkeyId: text({ length: 100 }).primaryKey(),
		username: text(),
		platformName: text(),
		platformIcon: text(),
		createdAt: int().notNull()
	},
	(table) => [index('passkeys_user_id_idx').on(table.userId)]
);

export const sessionsTable = sqliteTable(
	'sessions',
	{
		id: text().primaryKey(),
		userId: int()
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		secretHash: text().notNull(),
		createdAt: int().notNull(),
		// when the session token was checked
		lastVerifiedAt: int().notNull(),
		// when the last passkey based authentication took place
		passkeyAuthenticatedAt: int()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

/**
 * Serves several purposes:
 * 1) signup - acts as a transient user record pending email verification
 * 2) change email - used to verify ownership of the new address
 */
export const challengesTable = sqliteTable(
	'challenges',
	{
		id: text().primaryKey(),
		purpose: text().notNull(),
		userId: int().references(() => usersTable.id, { onDelete: 'cascade' }),
		email: text().notNull(),
		// signup
		givenName: text(),
		familyName: text(),
		secretHash: text().notNull(),
		codeHash: text().notNull(),
		failedAttempts: int().notNull(),
		consumedAt: int(),
		createdAt: int().notNull(),
		// after N mins the code expires and the user must request a new code
		codeExpiresAt: int().notNull(),
		// after N mins the whole process must be restarted i.e. the user
		// will have to sign up again or go back to the account management
		// screen and change their password again.
		challengeExpiresAt: int().notNull()
	},
	(table) => [
		index('challenges_user_id_idx').on(table.userId),
		index('challenges_email_idx').on(table.email)
	]
);

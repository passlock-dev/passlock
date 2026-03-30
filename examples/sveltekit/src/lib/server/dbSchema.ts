import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema for the example app.
 *
 * Passlock remains the source of truth for challenge verification and passkey
 * operations. The local database stores the application-facing account,
 * session, and passkey metadata that the sample needs for UI and routing.
 */
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
		// Updated whenever the session token is re-validated.
		lastVerifiedAt: int().notNull(),
		// Used to enforce fresh passkey confirmation for sensitive actions.
		passkeyAuthenticatedAt: int()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

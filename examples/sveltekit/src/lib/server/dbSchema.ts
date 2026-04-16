/**
 * Drizzle schema for the example app.
 *
 * Passlock remains the source of truth for challenge verification and passkey
 * operations. The local database stores the application-facing account,
 * session, and passkey metadata that the sample needs for UI and routing.
 */

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
		// inferred from the account email but could be different
		username: text(),
		// Platform the passkey belongs to e.g. "Apple Passwords"
		platformName: text(),
		// Quick visual reference for the user
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
		// we dont want to store plaintext session secrets
		secretHash: text().notNull(),
		// Updated whenever the session token is re-validated.
		lastVerifiedAt: int().notNull(),
		// Used to enforce fresh passkey confirmation for sensitive actions.
		passkeyAuthenticatedAt: int(),
		createdAt: int().notNull()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

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
		// Kept separate so TOTP cannot satisfy a registered passkey requirement.
		totpAuthenticatedAt: int(),
		accountDeletionAuthorizedAt: int(),
		createdAt: int().notNull()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

// Public authenticator metadata only. Setup secrets and submitted codes are never stored here.
export const totpAuthenticatorsTable = sqliteTable(
	'totp_authenticators',
	{
		authenticatorId: text().primaryKey(),
		userId: int()
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		enrollmentSessionId: text().notNull(),
		status: text({ enum: ['pending', 'confirming', 'active'] }).notNull(),
		displayName: text().notNull(),
		digits: int().notNull(),
		expiresAt: int().notNull(),
		createdAt: int().notNull()
	},
	(table) => [index('totp_user_id_idx').on(table.userId)]
);

// A pending login is not a session. Only its random token hash is stored.
export const pendingTotpLoginsTable = sqliteTable('pending_totp_logins', {
	tokenHash: text().primaryKey(),
	userId: int()
		.notNull()
		.unique()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	authenticatorIds: text({ mode: 'json' }).$type<string[]>().notNull(),
	expiresAt: int().notNull(),
	attempts: int().notNull().default(0),
	state: text({ enum: ['ready', 'verifying'] })
		.notNull()
		.default('ready')
});

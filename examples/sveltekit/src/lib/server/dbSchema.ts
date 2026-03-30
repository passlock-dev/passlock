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

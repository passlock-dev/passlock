import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
	id: int().primaryKey({ autoIncrement: true }),
	email: text().notNull().unique(),
	givenName: text().notNull(),
	createdAt: int().notNull()
});

export const passwordsTable = sqliteTable(
	'passwords',
	{
		userId: int()
			.primaryKey()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		passwordHash: text().notNull(),
		createdAt: int().notNull()
	},
	(table) => [index('passwords_user_id_idx').on(table.userId)]
);

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
		lastVerifiedAt: int().notNull()
	},
	(table) => [index('sessions_user_id_idx').on(table.userId)]
);

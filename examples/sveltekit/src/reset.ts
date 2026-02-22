import db from '$lib/server/db';
import { passkeysTable, passwordsTable, sessionsTable, usersTable } from '$lib/server/schema';

const reset = async () => {
	await db.delete(passkeysTable);
	await db.delete(sessionsTable);
	await db.delete(passwordsTable);
	await db.delete(usersTable);
};

reset();

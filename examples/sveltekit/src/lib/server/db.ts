import { drizzle } from 'drizzle-orm/libsql';
import { DB_FILE_NAME } from '$app/env/private';

export default drizzle(DB_FILE_NAME!);

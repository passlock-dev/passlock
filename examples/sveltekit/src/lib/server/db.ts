import { drizzle } from 'drizzle-orm/libsql';
import { DB_FILE_NAME } from '$env/static/private';

export default drizzle(DB_FILE_NAME!);

import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/dbSchema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DB_FILE_NAME!
	}
});

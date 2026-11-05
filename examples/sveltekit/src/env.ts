import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DB_FILE_NAME: { static: true },
	PASSLOCK_API_KEY: { static: true },
	PASSLOCK_RP_ID: { static: true },
	PUBLIC_PASSLOCK_ENDPOINT: { public: true, static: true },
	PUBLIC_PASSLOCK_TENANCY_ID: { public: true, static: true },
	PUBLIC_ENABLE_DEV_NOTES: { public: true, static: true }
});

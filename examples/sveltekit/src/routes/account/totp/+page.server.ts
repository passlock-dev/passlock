import type { PageServerLoad } from './$types';
import { requireAccountContext } from '#lib/server/account.js';
import { getPasslockClientConfig } from '#lib/server/passlock.js';
import { totpStore } from '#lib/server/totpRuntime.js';

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('account:totp');
	const context = await requireAccountContext(locals);
	const records = await totpStore.list(context.user.userId);
	return {
		credentials: records.map((row) => ({
			id: row.authenticatorId,
			displayName: row.displayName,
			status: row.status,
			digits: row.digits,
			expiresAt: row.expiresAt
		})),
		...getPasslockClientConfig()
	};
};

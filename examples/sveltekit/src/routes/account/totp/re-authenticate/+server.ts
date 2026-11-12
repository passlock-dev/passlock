import { getAccountContext } from '#lib/server/account.js';
import { refreshTotpAuthenticatedAt } from '#lib/server/repository.js';
import { readTotpJson, totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { TotpFlowError } from '#lib/server/totp.js';
import { getTotpFlows } from '#lib/server/totpRuntime.js';
import { TotpSubmission } from '#lib/shared/totp.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, locals }) =>
	totpEndpoint(async () => {
		const context = await getAccountContext(locals);
		if (!context) throw new TotpFlowError(401, 'Authentication required.');
		if (context.reauthenticationMethod !== 'totp')
			throw new TotpFlowError(403, 'Use your registered passkey to confirm your identity.');
		const input = await readTotpJson(request, TotpSubmission);
		await getTotpFlows().reauthenticate(
			{ userId: context.user.userId, sessionId: context.session.id, email: context.user.email },
			input.authenticatorId,
			input.code
		);
		await refreshTotpAuthenticatedAt(context.session.id);
		return totpJson({ type: 'success' });
	});

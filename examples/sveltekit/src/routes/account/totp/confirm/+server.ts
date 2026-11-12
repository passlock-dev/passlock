import type { RequestHandler } from './$types';
import { requireTotpActor, readTotpJson, totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { getTotpFlows } from '#lib/server/totpRuntime.js';
import { TotpSubmission } from '#lib/shared/totp.js';

export const POST: RequestHandler = (event) =>
	totpEndpoint(async () => {
		const actor = await requireTotpActor(event);
		const input = await readTotpJson(event.request, TotpSubmission);
		await getTotpFlows().confirm(actor, input.authenticatorId, input.code);
		return totpJson({ type: 'success' });
	});

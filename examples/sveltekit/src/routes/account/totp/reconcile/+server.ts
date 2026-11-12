import type { RequestHandler } from './$types';
import { requireTotpActor, readTotpJson, totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { getTotpFlows } from '#lib/server/totpRuntime.js';
import { TotpIdentityInput } from '#lib/shared/totp.js';

export const POST: RequestHandler = (event) =>
	totpEndpoint(async () => {
		const actor = await requireTotpActor(event);
		const input = await readTotpJson(event.request, TotpIdentityInput);
		await getTotpFlows().reconcile(actor, input.authenticatorId);
		return totpJson({ type: 'success' });
	});

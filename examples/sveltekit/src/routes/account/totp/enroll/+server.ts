import type { RequestHandler } from './$types';
import { requireTotpActor, readTotpJson, totpEndpoint, totpJson } from '#lib/server/totpHttp.js';
import { getTotpFlows } from '#lib/server/totpRuntime.js';
import { EnrollmentInput } from '#lib/shared/totp.js';

export const POST: RequestHandler = (event) =>
	totpEndpoint(async () => {
		const actor = await requireTotpActor(event);
		const input = await readTotpJson(event.request, EnrollmentInput);
		return totpJson(await getTotpFlows().enroll(actor, input.displayName));
	});

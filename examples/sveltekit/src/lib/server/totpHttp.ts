import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import { getAccountContext } from './account';
import { TotpFlowError } from './totp';

export const sensitiveHeaders = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
export const totpJson = (body: unknown) => json(body, { headers: sensitiveHeaders });
export const totpEndpoint = async (run: () => Promise<Response>) => {
	try {
		return await run();
	} catch (error) {
		const failure =
			error instanceof TotpFlowError
				? error
				: new TotpFlowError(
						503,
						'This authenticator request could not be completed. Check its status or try again later.'
					);
		return json(
			{
				type: 'error',
				message: failure.message,
				...(failure.retryAfterSeconds ? { retryAfterSeconds: failure.retryAfterSeconds } : {})
			},
			{
				status: failure.status,
				headers: {
					...sensitiveHeaders,
					...(failure.retryAfterSeconds ? { 'Retry-After': String(failure.retryAfterSeconds) } : {})
				}
			}
		);
	}
};
export const requireTotpActor = async (event: RequestEvent) => {
	const context = await getAccountContext(event.locals);
	if (!context) throw new TotpFlowError(401, 'Sign in to manage authenticators.');
	if (context.reauthenticationRequired)
		throw new TotpFlowError(403, 'Confirm your passkey before changing authenticators.');
	return { userId: context.user.userId, sessionId: context.session.id, email: context.user.email };
};
export const readTotpJson = async <S extends v.GenericSchema>(
	request: Request,
	schema: S
): Promise<v.InferOutput<S>> => {
	if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
		throw new TotpFlowError(400, 'Expected a JSON request.');
	const reader = request.body?.getReader();
	if (!reader) throw new TotpFlowError(400, 'Missing request body.');
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > 4096) {
				await reader.cancel();
				throw new TotpFlowError(413, 'Request body too large.');
			}
			chunks.push(value);
		}
		const bytes = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		const result = v.safeParse(schema, JSON.parse(new TextDecoder().decode(bytes)));
		if (!result.success)
			throw new TotpFlowError(400, 'Enter the requested details exactly as shown.');
		return result.output;
	} catch (error) {
		if (error instanceof TotpFlowError) throw error;
		throw new TotpFlowError(400, 'Invalid request.');
	} finally {
		reader.releaseLock();
	}
};

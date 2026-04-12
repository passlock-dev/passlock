import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import * as v from 'valibot';

export const verifyCodeSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'Enter the 6-digit code'))
});

export const createVerifyCodeForm = () =>
	superValidate(valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

export const validateVerifyCodeForm = (request: Request) =>
	superValidate(request, valibot(verifyCodeSchema), {
		id: 'verify-code-form'
	});

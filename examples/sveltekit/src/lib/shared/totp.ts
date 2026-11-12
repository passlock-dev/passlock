import * as v from 'valibot';

export const TotpId = v.pipe(v.string(), v.regex(/^[a-z0-9]{15}$/));
export const TotpCode = v.pipe(v.string(), v.regex(/^(?:[0-9]{6}|[0-9]{8})$/));
export const EnrollmentInput = v.strictObject({
	displayName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120))
});
export const TotpIdentityInput = v.strictObject({ authenticatorId: TotpId });
export const TotpSubmission = v.strictObject({ authenticatorId: TotpId, code: TotpCode });
export const TotpResponse = v.variant('type', [
	v.object({
		type: v.literal('error'),
		message: v.string(),
		retryAfterSeconds: v.optional(v.number())
	}),
	v.object({ type: v.literal('success') }),
	v.object({ type: v.literal('loggedIn') }),
	v.object({
		type: v.literal('enrollment'),
		authenticatorId: TotpId,
		digits: v.picklist([6, 8]),
		expiresAt: v.number(),
		setup: v.object({
			secret: v.string(),
			uri: v.string(),
			qrCodeDataUrl: v.pipe(v.string(), v.startsWith('data:image/png;base64,'))
		})
	})
]);
export type TotpResponse = v.InferOutput<typeof TotpResponse>;
export type TotpEnrollment = Extract<TotpResponse, { type: 'enrollment' }>;

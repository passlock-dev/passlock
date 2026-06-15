import * as v from 'valibot';
import { ChallengeRateLimitViewSchema } from './challengeRateLimit.js';

/**
 * Shared JSON response schemas used by both route handlers and client-side
 * helpers. Keeping these in one place makes the server/client contract
 * explicit.
 */
export const RegisterPasskeySuccess = v.object({
	_tag: v.literal('RegisterPasskeySuccess')
});

export const AuthorizedPasskeyRegistration = v.object({
	_tag: v.literal('AuthorizedPasskeyRegistration'),
	expiresAt: v.number(),
	registrationToken: v.string()
});

export const AuthorizedPasskeyAuthentication = v.object({
	_tag: v.literal('AuthorizedPasskeyAuthentication'),
	expiresAt: v.number(),
	authenticationToken: v.string()
});

export const PasskeyManagementWarning = v.object({
	code: v.picklist([
		'PASSKEY_NOT_FOUND',
		'NO_PASSKEYS_FOUND',
		'BROWSER_SIGNAL_UNSUPPORTED',
		'BROWSER_SIGNAL_FAILED',
		'EMPTY_SIGNAL_PAYLOAD'
	]),
	message: v.string(),
	passkeyId: v.optional(v.string())
});

export const UpdatePasskeysSuccess = v.object({
	_tag: v.literal('PreparedPasskeyUpdate'),
	updatePasskeysToken: v.string(),
	expiresAt: v.number(),
	warnings: v.pipe(v.array(PasskeyManagementWarning), v.readonly())
});

export const DeletePasskeySuccess = v.object({
	_tag: v.literal('PreparedPasskeyDeletion'),
	deletePasskeysToken: v.string(),
	expiresAt: v.number(),
	warnings: v.pipe(v.array(PasskeyManagementWarning), v.readonly())
});

export const DeleteUserPasskeysSuccess = v.object({
	_tag: v.literal('PreparedPasskeyDeletion'),
	deletePasskeysToken: v.string(),
	expiresAt: v.number(),
	warnings: v.pipe(v.array(PasskeyManagementWarning), v.readonly())
});

export const PasskeyStatusSuccess = v.object({
	_tag: v.literal('PasskeyStatusSuccess'),
	passkeyCount: v.number(),
	reauthenticationRequired: v.boolean()
});

/**
 * Shared validation schemas for account profile and email forms.
 */
export const ProfileSchema = v.object({
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required'))
});

export const EmailSchema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

export const Error = v.object({
	_tag: v.literal('@error/Error'),
	message: v.string()
});

export const ResendChallengeSuccess = v.object({
	_tag: v.literal('ResendChallengeSuccess'),
	message: v.string()
});

export const ResendChallengeRateLimited = v.object({
	_tag: v.literal('ResendChallengeRateLimited'),
	rateLimit: ChallengeRateLimitViewSchema
});

export const ResendChallengeRedirect = v.object({
	_tag: v.literal('ResendChallengeRedirect'),
	location: v.string()
});

export const ResendChallengeResponse = v.variant('_tag', [
	ResendChallengeSuccess,
	ResendChallengeRateLimited,
	ResendChallengeRedirect,
	Error
]);

import * as v from 'valibot';
import { ChallengeRateLimitViewSchema } from './challengeRateLimit.js';

export const RegisterPasskeySuccess = v.object({
	_tag: v.literal('RegisterPasskeySuccess')
});

export const UpdatedCredential = v.object({
	rpId: v.string(),
	userId: v.string(),
	username: v.string(),
	displayName: v.string()
});

export const DeletedCredential = v.object({
	credentialId: v.string(),
	userId: v.string(),
	rpId: v.string()
});

export const UpdatePasskeysSuccess = v.object({
	_tag: v.literal('UpdatePasskeySuccess'),
	credentials: v.pipe(v.array(UpdatedCredential), v.readonly())
});

export const DeletePasskeyWarning = v.object({
	_tag: v.literal('@warning/PasskeyNotFound'),
	message: v.string()
});

export const DeletePasskeySuccess = v.object({
	_tag: v.literal('DeletePasskeySuccess'),
	deleted: DeletedCredential
});

export const DeleteUserPasskeysSuccess = v.object({
	_tag: v.literal('DeleteUserPasskeysSuccess'),
	deleted: v.pipe(v.array(DeletedCredential), v.readonly())
});

export const PasskeyStatusSuccess = v.object({
	_tag: v.literal('PasskeyStatusSuccess'),
	passkeyIds: v.pipe(v.array(v.string()), v.readonly()),
	reauthenticationRequired: v.boolean()
});

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

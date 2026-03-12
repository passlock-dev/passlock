import * as v from 'valibot';

export const RegisterPasskeySuccess = v.object({
	_tag: v.literal('RegisterPasskeySuccess')
});

export const Credential = v.object({
	rpId: v.string(),
	userId: v.string(),
	username: v.string(),
	displayName: v.string()
});

export const UpdatePasskeysSuccess = v.object({
	_tag: v.literal('UpdatePasskeySuccess'),
	credentials: v.pipe(v.array(Credential), v.readonly())
});

export const DeletePasskeySuccess = v.object({
	_tag: v.literal('DeletePasskeySuccess'),
	warning: v.nullable(v.string())
});

export const Error = v.object({
	_tag: v.literal('@error/Error'),
	message: v.string()
});

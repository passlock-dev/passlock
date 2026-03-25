import * as v from 'valibot';

export const profileSchema = v.object({
	givenName: v.pipe(v.string(), v.trim(), v.nonEmpty('First name is required')),
	familyName: v.pipe(v.string(), v.trim(), v.nonEmpty('Last name is required'))
});

export const emailSchema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Email is required'),
		v.email('Enter a valid email address')
	)
});

import * as v from 'valibot';

export const deleteAccountSchema = v.object({
	intent: v.literal('delete-account')
});

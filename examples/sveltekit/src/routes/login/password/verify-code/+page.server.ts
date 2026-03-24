import type { Actions, PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const redirectToVerify = () => {
	redirect(303, resolve('/login/email/verify-code'));
};

export const load = (() => {
	redirectToVerify();
}) satisfies PageServerLoad;

export const actions = {
	verify: async () => {
		redirectToVerify();
	},
	resend: async () => {
		redirectToVerify();
	}
} satisfies Actions;

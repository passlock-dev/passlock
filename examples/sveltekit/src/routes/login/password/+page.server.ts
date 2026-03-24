import type { Actions, PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

const toEmailLogin = (username: string | null) => {
	const suffix = username ? `?username=${encodeURIComponent(username)}` : '';
	redirect(303, `${resolve('/login/email')}${suffix}`);
};

export const load = (({ url }) => {
	toEmailLogin(url.searchParams.get('username'));
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		toEmailLogin(formData.get('username')?.toString() ?? null);
	}
} satisfies Actions;

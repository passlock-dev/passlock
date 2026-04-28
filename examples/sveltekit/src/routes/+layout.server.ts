import type { LayoutServerLoad } from './$types';
import packageJson from '../../package.json' with { type: 'json' };

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		version: packageJson.version
	};
};

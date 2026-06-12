import { json } from '@sveltejs/kit';

export const errorResponse = (message: string, status: number) =>
	json({ _tag: '@error/Error' as const, message }, { status });

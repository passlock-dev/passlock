/**
 * Wrap `fetch` so client-side auth helpers can turn JSON responses into typed
 * success or error values without duplicating the same parsing boilerplate.
 *
 * The caller decides how to interpret both 2xx and non-2xx responses. That is
 * important in this sample because route handlers use HTTP status codes to
 * signal auth outcomes, while the UI still expects a typed body either way.
 */
export const fetchData = async <A, E>({
	url,
	method,
	body,
	on2xx,
	orElse
}: {
	url: string;
	body?: object;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	on2xx: (response: unknown) => A;
	orElse: (response: unknown) => E;
}) => {
	const response = await fetch(url, {
		method,
		headers: {
			'content-type': 'application/json'
		},
		...(body ? { body: JSON.stringify(body) } : {})
	});

	const jsonResponse = await response.json();

	return response.ok ? on2xx(jsonResponse) : orElse(jsonResponse);
};

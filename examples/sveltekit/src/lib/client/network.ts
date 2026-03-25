/**
 * Simple wrapper around fetch
 *
 * @param param0
 * @returns
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

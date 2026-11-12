/** JSON endpoints need the same origin protection as SvelteKit form actions. */
export const isSameOriginMutation = (request: Request, url: URL) =>
	['GET', 'HEAD', 'OPTIONS'].includes(request.method) ||
	request.headers.get('origin') === url.origin;
export const isTotpPath = (pathname: string) => /^\/(?:account|login)\/totp(?:\/|$)/.test(pathname);

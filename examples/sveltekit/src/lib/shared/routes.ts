import { resolve } from '$app/paths';

/**
 * String literal route type that optionally includes a query string.
 */
export type QueryLocation<Path extends string> = Path | `${Path}?${string}`;

export const root = resolve('/') as '/';
export const loginPath = resolve('/login') as '/login';
export const signupPath = resolve('/signup') as '/signup';
export const accountPath = resolve('/account') as '/account';
export const loginEmailPath = resolve('/login/email') as '/login/email';
export const loginPasskeyPath = resolve('/login/passkey') as '/login/passkey';

export type LoginLocation = QueryLocation<typeof loginPath>;
export type SignupLocation = QueryLocation<typeof signupPath>;
export type AccountLocation = QueryLocation<typeof accountPath>;
export type LoginEmailLocation = QueryLocation<typeof loginEmailPath>;
export type LoginPasskeyLocation = QueryLocation<typeof loginPasskeyPath>;

export type ResendRedirectLocation = LoginLocation | SignupLocation | AccountLocation;

/**
 * Resend responses are parsed from JSON, so the client still needs a
 * shared narrow cast when turning an untyped payload back into an expected
 * route shape.
 */
export const asResendRedirectLocation = (location: string) => location as ResendRedirectLocation;

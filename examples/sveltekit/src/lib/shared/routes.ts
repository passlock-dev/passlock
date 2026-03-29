import { resolve } from '$app/paths';

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
 * shared narrow cast when turning the untyped payload back into a route.
 */
export const asResendRedirectLocation = (location: string) => location as ResendRedirectLocation;

import * as g from 'google-one-tap';

declare global {
	namespace google {
		// eslint-disable-next-line no-unused-labels, @typescript-eslint/no-unused-expressions
		accounts: g.accounts;
	}
}

import type { Principal } from '@passlock/client'
import { error } from '@sveltejs/kit'

export type TokenVerifierProps = {
	readonly tenancyId: string;
	readonly apiKey: string;
	readonly endpoint?: string;
};

const delayPromise = <T>(p: () => Promise<T>) => {
	return new Promise((resolve) => {
		setTimeout(resolve, 200);
	}).then(p);
};

export class TokenVerifier {
	readonly tenancyId: string;
	readonly apiKey: string;
	readonly endpoint?: string;

	constructor(props: TokenVerifierProps) {
		this.tenancyId = props.tenancyId;
		this.apiKey = props.apiKey;
    if (props.endpoint) {
      this.endpoint = props.endpoint
    }
	}

	private readonly _exchangeToken = async (token: string, retryCount = 0): Promise<Principal> => {
		const endpoint = this.endpoint ?? 'https://api.passlock.dev';
		const url = `${endpoint}/${this.tenancyId}/token/${token}`;

		const headers = {
			Accept: 'application/json',
			Authorization: `Bearer ${this.apiKey}`
		};

		const response = await fetch(url, { headers });

		if (!response.ok && response.status >= 500 && retryCount < 5) {
			const errorMessage = await response.json();
			console.warn(errorMessage);
			console.warn('Retrying...');
			await delayPromise(() => this._exchangeToken(token, retryCount + 1));
		} else {
			const errorMessage = await response.json();
			console.error(errorMessage);
			error(500, 'Unable to exchange token');
		}

		const principal = await response.json();

		return principal as Principal;
	};

	/**
	 * Call the Passlock REST API to exchange the token for a principal.
	 *
	 * Coming Soon - local JWT based verification (avoiding the network trip).
	 *
	 * @param token
	 * @returns
	 */
	readonly exchangeToken = async (token: string): Promise<Principal> => {
		const url = `${this.endpoint}/${this.tenancyId}/token/${token}`;

		const headers = {
			Accept: 'application/json',
			Authorization: `Bearer ${this.apiKey}`
		};

		const response = await fetch(url, { headers });

		if (!response.ok) {
			const errorMessage = await response.json();
			console.error(errorMessage);
			error(500, 'Unable to exchange token');
		}

		const principal = await response.json();

		return principal as Principal;
	};
}

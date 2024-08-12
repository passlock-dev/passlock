import { ErrorCode, Passlock, PasslockError, type Principal, type UserPrincipal } from '@passlock/client'
import { PASSLOCK_CLIENT_VERSION } from './version.js'

export type TokenVerifierProps = {
	readonly tenancyId: string;
	readonly apiKey: string;
	readonly endpoint?: string;
};

const delayPromise = <T>(p: () => Promise<T>) => {
	return new Promise((resolve) => {
		setTimeout(resolve, 100);
	}).then(p);
};

export class TokenVerifier {
	readonly tenancyId: string;
	readonly apiKey: string;
	readonly endpoint?: string;

	constructor(props: TokenVerifierProps) {
		this.tenancyId = props.tenancyId;
		this.apiKey = props.apiKey;
		this.endpoint = props.endpoint;
	}

	private readonly _exchangeToken = async (token: string, retryCount = 0): Promise<Principal | PasslockError> => {
		const endpoint = this.endpoint ?? 'https://api.passlock.dev';
		const url = `${endpoint}/${this.tenancyId}/token/${token}`;

		const headers = {
			Accept: 'application/json',
			Authorization: `Bearer ${this.apiKey}`,
      'X-PASSLOCK-CLIENT-VERSION': PASSLOCK_CLIENT_VERSION,
		};

		const response = await fetch(url, { headers });

		if (!response.ok && response.status >= 500 && retryCount < 5) {
			const errorMessage = await response.json();
			console.warn(errorMessage);
			console.warn('Retrying...');
			await delayPromise(() => this._exchangeToken(token, retryCount + 1));
		} if (!response.ok) {
			const errorMessage = await response.json();
      return new PasslockError(
        "Unable to exchange token with Passlock backend", 
        ErrorCode.InternalServerError, 
        errorMessage
      )
		} else {
      const principal = await response.json();
      return principal as Principal;
    }
	};

	/**
	 * Call the Passlock REST API to exchange the token for a principal.
	 *
	 * Coming Soon - local JWT based verification (avoiding the network trip).
	 *
	 * @param token
	 * @returns
	 */
	readonly exchangeToken = async (token: string): Promise<Principal | PasslockError> => this._exchangeToken(token, 0)

  readonly exchangeUserToken = async (token: string): Promise<UserPrincipal | PasslockError> => {
    const principal = await this.exchangeToken(token)
    
    if (PasslockError.isError(principal)) return principal

    if (!Passlock.isUserPrincipal(principal)) return new PasslockError(
      "No user details returned from Passlock backend", 
      ErrorCode.InternalServerError
    )

    return principal
  }
}

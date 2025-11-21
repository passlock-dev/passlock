import { pipe } from "effect";
import { runToPromise, runToPromiseUnsafe } from "../../promise";
import {
  authenticatePasskey as authenticatePasskeyM,
  type AuthenticationError,
  type AuthenticationOptions,
  type AuthenticationSuccess,
} from "./micro";

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 * 
 * @param options 
 * @returns 
 */
export const authenticatePasskeyUnsafe = (
  options: AuthenticationOptions,
): Promise<AuthenticationSuccess> =>
  pipe(authenticatePasskeyM(options), runToPromiseUnsafe);

/**
 * Trigger local passkey authentication then verify the passkey in the Passlock vault.
 * Returns a code and id_token that can be exchanged/decoded in your backend.
 * 
 * @param options 
 * @returns 
 */  
export const authenticatePasskey = (
  options: AuthenticationOptions,
): Promise<AuthenticationSuccess | AuthenticationError> =>
  pipe(authenticatePasskeyM(options), runToPromise);

export { isAuthenticationSuccess } from "./micro";

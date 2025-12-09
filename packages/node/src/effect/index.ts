import { Effect, flow, pipe } from "effect";

import {
  exchangeCode as exchangeCodeE,
  verifyIdToken as verifyIdTokenE,
  type Principal,
} from "../principal/effect.js";

import { FetchHttpClient } from "@effect/platform";

import { getPasskey as getPasskeyE } from "../passkey/getPasskey.js";
import { deletePasskey as deletePasskeyE } from "../passkey/deletePasskey.js";
import { assignUser as assignUserE } from "../passkey/assignUser.js";
import type { AuthorizedApiOptions } from "../shared.js";
import type { Forbidden, InvalidCode } from "../schemas/errors.js";

/* Principal */

export const exchangeCode = (
  code: string,
  options: AuthorizedApiOptions,
): Effect.Effect<Principal, InvalidCode | Forbidden> =>
  pipe(exchangeCodeE(code, options), Effect.provide(FetchHttpClient.layer));

export type { Principal } from "../principal/effect.js";

export const verifyIdToken = verifyIdTokenE;

export type {
  ExchangeCodeOptions,
  VerifyTokenOptions,
} from "../principal/effect.js";

/* Passkey */

export const getPasskey = flow(
  getPasskeyE,
  Effect.provide(FetchHttpClient.layer),
);

export type {
  GetAuthenticatorOptions,
  Passkey,
} from "../passkey/getPasskey.js";

export const deletePasskey = flow(
  deletePasskeyE,
  Effect.provide(FetchHttpClient.layer),
);

export type { DeleteAuthenticatorOptions } from "../passkey/deletePasskey.js";

export const assignUser = flow(
  assignUserE,
  Effect.provide(FetchHttpClient.layer),
);

export type { AssignUserRequest } from "../passkey/assignUser.js";

export { Forbidden, NotFound } from "../schemas/errors.js";

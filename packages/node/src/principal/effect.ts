import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Effect, Match, pipe, Schema } from "effect";
import * as jose from "jose";

import {
  VerificationFailure,
  type ApiOptions,
  type AuthorizedApiOptions,
} from "../shared.js";

import { Forbidden, InvalidCode } from "../schemas/errors.js";
import { IdToken, Principal } from "../schemas/principal.js";

type ExchangeCodeOptions = AuthorizedApiOptions;

export const exchangeCode = (
  code: string,
  options: ExchangeCodeOptions,
): Effect.Effect<Principal, InvalidCode | Forbidden, HttpClient.HttpClient> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = options.endpoint ?? "https://api.passlock.dev";
      const { tenancyId } = options;

      const url = new URL(`/${tenancyId}/principal/${code}`, baseUrl);

      const response = yield* pipe(
        client.get(url, {
          headers: { Authorization: `Bearer ${options.apiKey}` },
        }),
      );

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(Principal)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(
            Schema.Union(InvalidCode, Forbidden),
          )(response),
      });

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Principal", (principal) => Effect.succeed(principal)),
        Match.tag("@error/InvalidCode", (err) => Effect.fail(err)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive,
      );
    }),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
    }),
  );

type VerifyTokenOptions = ApiOptions;

const createJwks = (endpoint?: string) =>
  Effect.sync(() => {
    const baseUrl = endpoint ?? "https://api.passlock.dev";

    return jose.createRemoteJWKSet(new URL("/.well-known/jwks.json", baseUrl));
  });

const createCachedRemoteJwks = pipe(
  Effect.cachedFunction(createJwks),
  Effect.runSync,
);

export const verifyIdToken = (
  token: string,
  options: VerifyTokenOptions,
): Effect.Effect<Principal, VerificationFailure> =>
  pipe(
    Effect.gen(function* () {
      const JWKS = yield* createCachedRemoteJwks(options.endpoint);

      const { payload } = yield* Effect.tryPromise({
        try: () =>
          jose.jwtVerify(token, JWKS, {
            issuer: "passlock.dev",
            audience: options.tenancyId,
          }),
        catch: (err) => {
          console.error(err);
          return err instanceof Error
            ? new VerificationFailure({ message: err.message })
            : new VerificationFailure({ message: String(err) });
        },
      });

      const idToken = yield* Schema.decodeUnknown(IdToken)({
        ...payload,
        _tag: "IdToken",
      });

      const principal: Principal = {
        _tag: "Principal",
        authenticatorType: "passkey",
        userId: idToken.sub,
        authenticatorId: idToken["a:id"],
        passkey: {
          verified: true,
          userVerified: idToken["pk:uv"],
        },
        createdAt: idToken.iat * 1000,
        expiresAt: idToken.exp * 1000,
      };

      return principal;
    }),
    Effect.catchTag("ParseError", (err) => Effect.die(err)),
  );

export type { ExchangeCodeOptions, Principal, VerifyTokenOptions };

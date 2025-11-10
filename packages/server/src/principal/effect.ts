import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform";
import type {
  RequestError,
  ResponseError,
} from "@effect/platform/HttpClientError";
import { Data, Effect, Match, pipe, Schema } from "effect";
import type { ParseError } from "effect/ParseResult";
import * as jose from "jose";

const Principal = Schema.Struct({
  tenancyId: Schema.String,
  userId: Schema.String,
  code: Schema.String,
  authenticatorId: Schema.String,
  passkey: Schema.optionalWith(
    Schema.Struct({
      userVerified: Schema.optionalWith(Schema.Boolean, { nullable: true }),
    }),
    {
      nullable: true,
    },
  ),
  createdAt: Schema.DateFromNumber,
  expiresAt: Schema.DateFromNumber,
});

export type Principal = typeof Principal.Type;

const IdToken = Schema.Struct({
  "a:id": Schema.String,
  "a:typ": Schema.String,
  iss: Schema.Literal("passlock.dev"),
  "pk:uv": Schema.Boolean,
  sub: Schema.String,
  jti: Schema.String,
  aud: Schema.String,
  iat: Schema.Number,
  exp: Schema.Number,
});

export type IdToken = typeof IdToken.Type;

const Response = Schema.Struct({
  _tag: Schema.tag("Success"),
  principal: Principal,
});

type Response = typeof Response.Type;

const InvalidCodeError = Schema.Struct({
  _tag: Schema.tag("InvalidCodeError"),
  message: Schema.String,
});

export type InvalidCodeError = typeof InvalidCodeError.Type;

const ForbiddenError = Schema.Struct({
  _tag: Schema.tag("Forbidden"),
  // message: Schema.String,
});

export type ForbiddenError = typeof ForbiddenError.Type;

export interface PasslockOptions {
  tenancyId: string;
  /**
   * @default https://api.passlock.dev
   */
  endpoint?: string;
}

export interface AuthenticatedPasslockOptions extends PasslockOptions {
  apiKey: string;
}

export const exchangeCode = (
  code: string,
  options: AuthenticatedPasslockOptions,
): Effect.Effect<
  Principal,
  InvalidCodeError | ForbiddenError | ParseError | RequestError | ResponseError,
  HttpClient.HttpClient
> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const baseUrl = options.endpoint ?? "https://api.passlock.dev";
    const url = new URL(`/${options.tenancyId}/principal/${code}`, baseUrl);

    const response = yield* pipe(
      client.get(url, { 
        headers: { 'Authorization': `Bearer ${options.apiKey}` } 
      }),
    );

    const encoded = yield* HttpClientResponse.matchStatus(response, {
      "2xx": () => HttpClientResponse.schemaBodyJson(Response)(response),
      orElse: () =>
        HttpClientResponse.schemaBodyJson(Schema.Union(InvalidCodeError, ForbiddenError))(response),
    });

    return yield* pipe(
      Match.value(encoded),
      Match.tag("Success", ({ principal }) => Effect.succeed(principal)),
      Match.tag("InvalidCodeError", (err) => Effect.fail(err)),
      Match.tag("Forbidden", (err) => Effect.fail(err)),
      Match.exhaustive,
    );
  });

export class VerificationError extends Data.TaggedError("VerificationError")<{
  message: string;
}> {}

export interface VerificationSuccess {
  principal: Principal;
  idToken: IdToken;
}

export const verifyIdToken = (
  token: string,
  options: PasslockOptions,
): Effect.Effect<VerificationSuccess, VerificationError | ParseError> =>
  Effect.gen(function* () {
    const baseUrl = options.endpoint ?? "https://api.passlock.dev";
    const JWKS = jose.createRemoteJWKSet(
      new URL("/.well-known/jwks.json", baseUrl),
    );

    const { payload } = yield* Effect.tryPromise({
      try: () =>
        jose.jwtVerify(token, JWKS, {
          issuer: "passlock.dev",
          audience: options.tenancyId,
        }),
      catch: (err) =>
        err instanceof Error
          ? new VerificationError({ message: err.message })
          : new VerificationError({ message: String(err) }),
    });

    const idToken = yield* Schema.decodeUnknown(IdToken)(payload);

    const principal: Principal = {
      tenancyId: options.tenancyId,
      userId: idToken.sub,
      code: idToken.jti,
      authenticatorId: idToken["a:id"],
      passkey: {
        userVerified: idToken["pk:uv"],
      },
      createdAt: new Date(idToken.iat * 1000),
      expiresAt: new Date(idToken.exp * 1000),
    };

    return { principal, idToken };
  });

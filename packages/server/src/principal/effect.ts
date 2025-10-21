import { HttpClient, HttpClientResponse } from "@effect/platform";
import { Data, Effect, Match, pipe, Schema } from "effect";
import * as jose from "jose";

const Principal = Schema.Struct({
  tenancyId: Schema.String,
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

type Principal = typeof Principal.Type;

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

const Response = Schema.Struct({
  _tag: Schema.tag("Success"),
  principal: Principal,
});

const InvalidCodeError = Schema.Struct({
  _tag: Schema.tag("InvalidCodeError"),
  message: Schema.String,
});

const ResponseError = Schema.Union(InvalidCodeError);

export const exchangeCode = ({
  tenancyId,
  code,
  endpoint,
}: {
  tenancyId: string;
  code: string;
  endpoint?: string;
}) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const baseUrl = endpoint ?? "https://api.passlock.dev";
    const url = new URL(`/${tenancyId}/principal/${code}`, baseUrl);
    const response = yield* client.get(url);

    const encoded = yield* HttpClientResponse.matchStatus(response, {
      "2xx": () => HttpClientResponse.schemaBodyJson(Response)(response),
      orElse: () => HttpClientResponse.schemaBodyJson(ResponseError)(response),
    });

    return yield* pipe(
      Match.value(encoded),
      Match.tag("Success", (data) => Effect.succeed(data)),
      Match.tag("InvalidCodeError", (err) => Effect.fail(err)),
      Match.exhaustive,
    );
  });

export class VerificationError extends Data.TaggedError("VerificationError")<{
  message: string;
}> {}

export const verifyIdToken = ({
  id_token,
  tenancyId,
  endpoint,
}: {
  id_token: string;
  tenancyId: string;
  endpoint?: string;
}) =>
  Effect.gen(function* () {
    const baseUrl = endpoint ?? "https://api.passlock.dev";
    const JWKS = jose.createRemoteJWKSet(new URL("/jwks", baseUrl));

    const { payload } = yield* Effect.tryPromise({
      try: () =>
        jose.jwtVerify(id_token, JWKS, {
          issuer: "passlock.dev",
          audience: tenancyId,
        }),
      catch: (err) =>
        err instanceof Error
          ? new VerificationError({ message: err.message })
          : new VerificationError({ message: String(err) }),
    });

    const idToken = yield* Schema.decodeUnknown(IdToken)(payload);

    const principal: Principal = {
      tenancyId,
      code: idToken.jti,
      authenticatorId: idToken["a:id"],
      passkey: {
        userVerified: idToken["pk:uv"],
      },
      createdAt: new Date(idToken.iat * 1000),
      expiresAt: new Date(idToken.exp * 1000),
    };

    return { principal, id_token: idToken };
  });

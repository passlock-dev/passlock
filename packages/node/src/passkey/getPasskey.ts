import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { Effect, Match, pipe, Schema } from "effect";
import { Passkey } from "../schemas/passkey.js";
import { Forbidden, NotFound } from "../schemas/errors.js";
import type { AuthorizedApiOptions } from "../shared.js";

type GetAuthenticatorOptions = AuthorizedApiOptions;

export const getPasskey = (
  authenticatorId: string,
  options: GetAuthenticatorOptions,
): Effect.Effect<Passkey, NotFound | Forbidden, HttpClient.HttpClient> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = options.endpoint ?? "https://api.passlock.dev";
      const { tenancyId } = options;

      const url = new URL(`/${tenancyId}/passkeys/${authenticatorId}`, baseUrl);

      const response = yield* HttpClientRequest.get(url, {
        headers: { Authorization: `Bearer ${options.apiKey}` },
      }).pipe(client.execute);

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(Passkey)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(
            response,
          ),
      });

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (data) => Effect.succeed(data)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
        Match.exhaustive,
      );
    }),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
    }),
  );

export type { GetAuthenticatorOptions, Passkey };

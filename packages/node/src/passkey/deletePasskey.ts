import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { Effect, Match, pipe, Schema } from "effect";
import { Forbidden, NotFound } from "../schemas/errors.js";
import type { AuthorizedApiOptions } from "../shared.js";

type DeleteAuthenticatorOptions = AuthorizedApiOptions;

export const deletePasskey = (
  authenticatorId: string,
  request: DeleteAuthenticatorOptions,
): Effect.Effect<void, NotFound | Forbidden, HttpClient.HttpClient> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = request.endpoint ?? "https://api.passlock.dev";
      const { tenancyId } = request;

      const url = new URL(`/${tenancyId}/passkeys/${authenticatorId}`, baseUrl);

      const response = yield* HttpClientRequest.del(url, {
        headers: { Authorization: `Bearer ${request.apiKey}` },
      }).pipe(client.execute);

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => Effect.succeed(null),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(Forbidden, NotFound))(
            response,
          ),
      });

      yield* pipe(
        Match.value(encoded),
        Match.when(Match.null, () => Effect.void),
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

export type { DeleteAuthenticatorOptions };

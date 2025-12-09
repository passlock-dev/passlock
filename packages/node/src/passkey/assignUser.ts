import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import { Effect, Match, pipe, Schema } from "effect";

import { Passkey } from "../schemas/passkey.js";
import { Forbidden, NotFound } from "../schemas/errors.js";
import type { AuthorizedApiOptions } from "../shared.js";

interface AssignUserRequest extends AuthorizedApiOptions {
  userId: string;
  authenticatorId: string;
}

export const assignUser = (
  request: AssignUserRequest,
): Effect.Effect<Passkey, NotFound | Forbidden, HttpClient.HttpClient> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = request.endpoint ?? "https://api.passlock.dev";
      const { userId, authenticatorId } = request;
      const { tenancyId } = request;

      const url = new URL(`/${tenancyId}/passkeys/${authenticatorId}`, baseUrl);

      const response = yield* HttpClientRequest.patch(url, {
        headers: { Authorization: `Bearer ${request.apiKey}` },
      }).pipe(
        HttpClientRequest.bodyJson({ userId }),
        Effect.flatMap(client.execute),
      );

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(Passkey)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(NotFound, Forbidden))(
            response,
          ),
      });

      return yield* pipe(
        Match.value(encoded),
        Match.tag("Passkey", (passkey) => Effect.succeed(passkey)),
        Match.tag("@error/NotFound", (err) => Effect.fail(err)),
        Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
        Match.exhaustive,
      );
    }),
    Effect.catchTags({
      ParseError: (err) => Effect.die(err),
      RequestError: (err) => Effect.die(err),
      ResponseError: (err) => Effect.die(err),
      HttpBodyError: (err) => Effect.die(err),
    }),
  );

export type { AssignUserRequest };

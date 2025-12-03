import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";

import type {
  RequestError,
  ResponseError,
} from "@effect/platform/HttpClientError";

import type { HttpBodyError } from "@effect/platform/HttpBody";

import { Effect, Match, pipe, Schema } from "effect";
import type { ParseError } from "effect/ParseResult";
import { Forbidden, NotFound, type AuthorizedApiOptions } from "../shared.js";

export const AssignedUser = Schema.Struct({
  userId: Schema.String,
  authenticatorId: Schema.String,
  updatedAt: Schema.DateFromNumber,
});

export type AssignedUser = typeof AssignedUser.Type;

const AssignUserResponse = Schema.Struct({
  _tag: Schema.tag("Success"),
  data: AssignedUser,
});

type AssignUserResponse = typeof AssignUserResponse.Type;

export interface AssignUserOptions extends AuthorizedApiOptions {
  userId: string;
  authenticatorId: string;
}

export const assignUser = (
  options: AssignUserOptions,
): Effect.Effect<
  AssignedUser,
  | NotFound
  | Forbidden
  | ParseError
  | RequestError
  | HttpBodyError
  | ResponseError,
  HttpClient.HttpClient
> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const baseUrl = options.endpoint ?? "https://api.passlock.dev";
    const { userId, authenticatorId } = options;

    const url = new URL(
      `/${options.tenancyId}/authenticator/${authenticatorId}`,
      baseUrl,
    );

    const response = yield* HttpClientRequest.patch(url, {
      headers: { Authorization: `Bearer ${options.apiKey}` },
    }).pipe(
      HttpClientRequest.bodyJson({ userId }),
      Effect.flatMap(client.execute),
    );

    const encoded = yield* HttpClientResponse.matchStatus(response, {
      "2xx": () =>
        HttpClientResponse.schemaBodyJson(AssignUserResponse)(response),
      orElse: () =>
        HttpClientResponse.schemaBodyJson(Schema.Union(NotFound, Forbidden))(
          response,
        ),
    });

    return yield* pipe(
      Match.value(encoded),
      Match.tag("Success", ({ data }) => Effect.succeed(data)),
      Match.tag("@error/NotFound", (err) => Effect.fail(err)),
      Match.tag("@error/Forbidden", (err) => Effect.fail(err)),
      Match.exhaustive,
    );
  });

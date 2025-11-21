import { FetchHttpClient } from "@effect/platform";
import { Effect, Either, Match, pipe } from "effect";
import type { AssignedUser, AssignUserOptions } from "./effect.js";
import { ServerError, type AuthorizedApiOptions } from "../shared.js";
import { assignUser as assignUserE } from "./effect.js";

export { 
  type AssignUserOptions as AssignUserRequest,
  type AssignedUser
} from "./effect.js";

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param options
 * @returns
 */
export const assignUserUnsafe = (
  options: AssignUserOptions,
): Promise<AssignedUser> =>
  pipe(
    assignUserE(options),
    Effect.either,
    Effect.provide(FetchHttpClient.layer),
    Effect.runPromise,
    (p) =>
      p.then((response) =>
        Either.match(response, {
          onLeft: (err) =>
            pipe(
              Match.value(err),
              Match.tag("ParseError", (err) => new ServerError(err)),
              Match.tag("RequestError", (err) => new ServerError(err)),
              Match.tag("ResponseError", (err) => new ServerError(err)),
              Match.tag("NotFound", (err) => new ServerError(err)),
              Match.tag(
                "HttpBodyError",
                (err) =>
                  new ServerError({
                    _tag: err.reason._tag,
                    message: "Invalid request payload",
                  }),
              ),
              Match.tag(
                "Forbidden",
                ({ _tag }) => new ServerError({ _tag, message: "Forbidden" }),
              ),
              Match.exhaustive,
              (serverError) => Promise.reject(serverError),
            ),
          onRight: (success) => Promise.resolve(success),
        }),
      ),
  );

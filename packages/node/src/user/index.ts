import { FetchHttpClient } from "@effect/platform";
import { Effect, identity, pipe } from "effect";
import { type Forbidden, type NotFound, UnexpectedError } from "../shared.js";
import type { AssignedUser, AssignUserOptions } from "./effect.js";
import { assignUser as assignUserE } from "./effect.js";

export {
  type AssignedUser,
  type AssignUserOptions as AssignUserRequest,
} from "./effect.js";

/**
 * Call the Passlock backend API to assign a userId to an authenticator
 * @param request
 * @param options
 * @returns
 */
export const assignUser = (
  options: AssignUserOptions,
): Promise<AssignedUser | NotFound | Forbidden> =>
  pipe(
    assignUserE(options),
    Effect.provide(FetchHttpClient.layer),
    Effect.catchTags({
      HttpBodyError: (err) =>
        Effect.die(
          new UnexpectedError({
            message: "Invalid request payload",
            _tag: err.reason._tag,
          }),
        ),
      ParseError: (err) => Effect.die(new UnexpectedError(err)),
      RequestError: (err) => Effect.die(new UnexpectedError(err)),
      ResponseError: (err) => Effect.die(new UnexpectedError(err)),
    }),
    Effect.match({ onFailure: identity, onSuccess: identity }),
    Effect.runPromise,
  );

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
    Effect.provide(FetchHttpClient.layer),
    Effect.catchTags({
      HttpBodyError: (err) =>
        Effect.die(
          new UnexpectedError({
            message: "Invalid request payload",
            _tag: err.reason._tag,
          }),
        ),
      ParseError: (err) => Effect.die(new UnexpectedError(err)),
      RequestError: (err) => Effect.die(new UnexpectedError(err)),
      ResponseError: (err) => Effect.die(new UnexpectedError(err)),
    }),
    Effect.runPromise,
  );

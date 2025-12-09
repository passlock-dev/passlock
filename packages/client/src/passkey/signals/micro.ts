import { Micro, pipe } from "effect";
import { Logger } from "../../logger";

/**
 * Tell the client device to remove a given credential
 * @param error
 * @returns
 */
export const signalCredentialRemoval = (credential: {
  credentialId: string;
  rpId: string;
}): Micro.Micro<void, never, Logger> =>
  pipe(
    Micro.gen(function* () {
      const logger = yield* Micro.service(Logger);

      // might not be defined in older browsers
      if (typeof PublicKeyCredential.signalUnknownCredential === "function") {
        yield* logger.logInfo("Signalling browser to remove passkey");

        yield* Micro.tryPromise({
          try: () => PublicKeyCredential.signalUnknownCredential(credential),
          catch: (err) => err,
        });

        yield* logger.logInfo("Passkey removed");
      }
    }),
    Micro.catchAll((err) =>
      pipe(
        Micro.service(Logger),
        Micro.flatMap((logger) =>
          err instanceof Error
            ? logger.logWarn(err.message)
            : logger.logWarn("Unable to signal credential removal"),
        ),
      ),
    ),
  );
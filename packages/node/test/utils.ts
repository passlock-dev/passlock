import { Config, Effect, pipe, Redacted } from "effect"

const lookupTenancyId = pipe(
  Config.string("PASSLOCK_TENANCY_ID"),
  Config.withDefault("itTenancy")
)

const lookupPasskeyId = pipe(
  Config.string("PASSLOCK_PASSKEY_ID"),
  Config.withDefault("itPasskey")
)

const lookupCode = pipe(
  Config.string("PASSLOCK_PRINCIPAL_CODE"),
  Config.withDefault("itPrincipal")
)

const lookupApiKey = pipe(
  Config.redacted("PASSLOCK_API_KEY"),
  Config.withDefault(Redacted.make("itApiKey"))
)

const lookupEndpoint = pipe(
  Config.string("PASSLOCK_ENDPOINT"),
  Config.withDefault("http://localhost:3000")
)

export const intTestConfig = Effect.gen(function* () {
  const tenancyId = yield* lookupTenancyId
  const passkeyId = yield* lookupPasskeyId
  const code = yield* lookupCode
  const apiKey = yield* lookupApiKey
  const endpoint = yield* lookupEndpoint

  return { tenancyId, passkeyId, code, apiKey, endpoint }
})

export const getHeaderValue = (
  headers: NonNullable<RequestInit["headers"]>,
  header: string
): string | null => new Headers(headers).get(header)

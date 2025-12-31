import { confirm, intro, isCancel, log, outro, spinner, text } from "@clack/prompts"
import { HttpBody, HttpClient, HttpClientResponse } from "@effect/platform"
import { Data, Effect, Match, pipe, Schema } from "effect"
import kleur from "kleur"

class CancelError extends Data.TaggedError("@error/Abort")<object> {}

const emailRegex = /^[^@]+@[^@]+.[^@]+$/

const SignupPayload = Schema.Struct({
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
})

type SignupPayload = typeof SignupPayload.Type

export class InvalidEmail extends Schema.TaggedError<InvalidEmail>("@error/InvalidEmail")(
  "@error/InvalidEmail",
  { message: Schema.String }
) {}

export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>("@error/DuplicateEmail")(
  "@error/DuplicateEmail",
  { message: Schema.String }
) {}

export const TenancyData = Schema.TaggedStruct("TenancyData", {
  apiKey: Schema.String,
  tenancyId: Schema.String,
})

export type TenancyData = typeof TenancyData.Type

const captureData: Effect.Effect<SignupPayload, CancelError> = Effect.gen(function* () {
  const email = yield* Effect.promise(() =>
    text({
      message: "Root account email? (we'll send a single use code to this address)",

      placeholder: "jdoe@gmail.com",

      validate(value) {
        if (value.length === 0) return `Value is required!`
        if (!emailRegex.test(value)) return `Please provide a valid email address!`
      },
    })
  )

  if (isCancel(email)) return yield* new CancelError({})

  const firstName = yield* Effect.promise(() =>
    text({
      message: "Your first/given name",

      placeholder: "John",

      validate(value) {
        if (value.length === 0) return `Value is required!`
      },
    })
  )

  if (isCancel(firstName)) return yield* new CancelError({})

  const lastName = yield* Effect.promise(() =>
    text({
      message: "Your last/family name",

      placeholder: "Doe",

      validate(value) {
        if (value.length === 0) return `Value is required!`
      },
    })
  )

  if (isCancel(lastName)) return yield* new CancelError({})

  const isConfirmed = yield* Effect.promise(() =>
    confirm({
      message: `Using ${firstName} ${lastName} <${email}>, continue?`,
    })
  )

  if (isCancel(isConfirmed)) return yield* new CancelError({})

  return isConfirmed ? { email, firstName, lastName } : yield* captureData
})

export const signup = (
  payload: SignupPayload
): Effect.Effect<TenancyData, InvalidEmail | DuplicateEmail, HttpClient.HttpClient> =>
  pipe(
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      const encodedPayload = yield* HttpBody.json(payload)

      const response = yield* pipe(
        // endpoint will be prepended by the HttpClient
        client.post("/signup", {
          body: encodedPayload,
        })
      )

      const encoded = yield* HttpClientResponse.matchStatus(response, {
        "2xx": () => HttpClientResponse.schemaBodyJson(TenancyData)(response),
        orElse: () =>
          HttpClientResponse.schemaBodyJson(Schema.Union(InvalidEmail, DuplicateEmail))(response),
      })

      return yield* pipe(
        Match.value(encoded),
        Match.tag("TenancyData", (principal) => Effect.succeed(principal)),
        Match.tag("@error/InvalidEmail", (err) => Effect.fail(err)),
        Match.tag("@error/DuplicateEmail", (err) => Effect.fail(err)),
        Match.exhaustive
      )
    }),
    Effect.catchTag("HttpBodyError", Effect.die),
    Effect.catchTag("ParseError", Effect.die),
    Effect.catchTag("RequestError", Effect.die),
    Effect.catchTag("ResponseError", Effect.die)
  )

export const init: Effect.Effect<void, never, HttpClient.HttpClient> = pipe(
  Effect.gen(function* () {
    intro(`Setting up new Passlock cloud instance...`)

    const signupData = yield* captureData
    const s = spinner()
    s.start("Setting up instance")

    const { tenancyId, apiKey } = yield* pipe(
      signup(signupData),
      Effect.tapError(() =>
        Effect.sync(() => {
          s.stop("Something went wrong", 1)
        })
      )
    )
    s.stop("Instance ready 🎉")

    log.success("Here are your development instance credentials.\nPlease keep them secure:")

    log.message(`Tenancy ID: ${kleur.green(tenancyId)}\n` + `API Key: ${kleur.green(apiKey)}`)

    log.message(
      `Login to your Passlock console at\n${kleur.blue().underline("https://console.passlock.dev")}`
    )

    log.message(
      "Check out the quick start guide at\n" +
        kleur.blue().underline("https://passlock.dev/getting-started/")
    )

    outro("You're all set!")
  }),
  Effect.catchTags({
    "@error/Abort": () =>
      Effect.sync(() => {
        log.error("Operation cancelled")
      }),
    "@error/DuplicateEmail": () =>
      Effect.sync(() => {
        log.error("Email already registered\n" + "Sign in at https://console.passlock.dev")
      }),
    "@error/InvalidEmail": () =>
      Effect.sync(() => {
        log.error("Invalid email address")
      }),
  })
)

import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { parseArgs, parseInitArgs } from "./cli.js"

describe("parseArgs", () => {
  describe("when parsed []", () => {
    it.effect("should return a tag of show-main", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs([])
        expect(result._tag).toEqual("show-main")
      })
    )
  })

  describe("when parsed [--help]", () => {
    it.effect("should return a tag of show-main-help", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["--help"])
        expect(result._tag).toEqual("show-main-help")
      })
    )
  })

  describe("when parsed [--version]", () => {
    it.effect("should return a tag of show-version", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["--version"])
        expect(result._tag).toEqual("show-version")
      })
    )
  })

  describe("when parsed [init, --help]", () => {
    it.effect("should return a tag of show-init-help", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["init", "--help"])
        expect(result._tag).toEqual("show-init-help")
      })
    )
  })

  describe("when parsed [init]", () => {
    it.effect("should return a tag of run-init", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["init"])
        expect(result._tag).toEqual("run-init")
      })
    )
  })

  describe("when parsed [init -e http://localhost:3000]", () => {
    it.effect("should return a tag of run-init", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["init", "-e", "http://localhost:3000"])
        expect(result._tag).toEqual("run-init")
      })
    )

    it.effect("should return an endpoint of http://localhost:3000", () =>
      Effect.gen(function* () {
        const result = yield* parseArgs(["init", "-e", "http://localhost:3000"])
        if (result._tag === "run-init") {
          expect(result.endpoint).toEqual("http://localhost:3000")
        } else {
          expect.fail("expected _tag to be run-init")
        }
      })
    )
  })

  describe("when parsed [init -e]", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const error = yield* parseArgs(["init", "-e"]).pipe(Effect.flip)
        expect(error._tag).toEqual("@error/CliParse")
        expect(error.message).toEqual("Missing value for --endpoint. Use --endpoint <url>.")
      })
    )
  })

  describe("when parsed [init -junk]", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const error = yield* parseArgs(["init", "-junk"]).pipe(Effect.flip)
        expect(error._tag).toEqual("@error/CliParse")
        expect(error.message).toEqual("Unknown option for init: -junk")
      })
    )
  })

  describe("when passed [junk]", () => {
    it.effect("should return an error", () =>
      Effect.gen(function* () {
        const error = yield* parseArgs(["junk"]).pipe(Effect.flip)
        expect(error._tag).toEqual("@error/CliParse")
        expect(error.message).toEqual("Unknown command: junk")
      })
    )
  })
})

describe("parseInitArgs", () => {
  describe("when parsed []", () => {
    it.effect("should return a tag of run-init", () =>
      Effect.gen(function* () {
        const result = yield* parseInitArgs([])
        expect(result._tag).toEqual("run-init")
      })
    )
  })

  describe("when parsed [--help]", () => {
    it.effect("should return a tag of show-init-help", () =>
      Effect.gen(function* () {
        const result = yield* parseInitArgs(["--help"])
        expect(result._tag).toEqual("show-init-help")
      })
    )
  })

  describe("when parsed [-e http://localhost:3000]", () => {
    it.effect("should return an endpoint of http://localhost:3000", () =>
      Effect.gen(function* () {
        const result = yield* parseInitArgs(["-e", "http://localhost:3000"])
        if (result._tag === "run-init") {
          expect(result.endpoint).toEqual("http://localhost:3000")
        } else {
          expect.fail("expected _tag to be run-init")
        }
      })
    )
  })
})

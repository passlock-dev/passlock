import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { stripVTControlCharacters } from "node:util"
import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { parseArgs, parseInitArgs } from "./cli.js"

describe("passlock executable", () => {
  const entry = fileURLToPath(new URL("./cli.ts", import.meta.url))
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ["--import", "tsx", entry, ...args], {
      encoding: "utf8",
      timeout: 5_000,
    })

  it("prints a hint and succeeds with no arguments", () => {
    const result = run()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Run with --help for commands and options")
  })

  it.each(["-v", "--version"])("prints only the version for %s", (flag) => {
    const result = run(flag)
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe("#{VERSION}#")
  })

  it("shows the endpoint option and its default in init help", () => {
    const result = run("init", "--help")
    expect(result.status).toBe(0)
    const help = stripVTControlCharacters(result.stdout)
    expect(help).toContain("--endpoint, -e")
    expect(help).toContain("https://api.passlock.dev")
  })

  it.each(["-e", "--endpoint="])("exits with an error for init %s", (flag) => {
    const result = run("init", flag)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("--endpoint")
    expect(result.stderr).not.toContain("ShowHelp")
  })
})

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

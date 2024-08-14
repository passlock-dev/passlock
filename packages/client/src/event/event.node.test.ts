import { Effect, pipe } from 'effect'
import { describe, expect, test } from 'vitest'

import { fireEvent } from './event.js'

// @vitest-environment node

describe('isPasslockEvent', () => {
  test("return a Passlock error if custom events aren't supported", async () => {
    const program = pipe(
      fireEvent('hello world'),
      Effect.flip,
      Effect.tap(e => {
        expect(e._tag).toBe('InternalBrowserError')
        expect(e.message).toBe('Unable to fire custom event')
      }),
    )

    await Effect.runPromise(program)
  })
})

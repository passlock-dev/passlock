import { Effect } from 'effect'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { DebugMessage, fireEvent, isPasslockEvent } from './event.js'

describe('fireEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('fire a custom log event', () => {
    const effect = fireEvent('hello world')
    const eventSpy = vi.spyOn(globalThis, 'dispatchEvent')
    Effect.runSync(effect)

    const expectedEvent = new CustomEvent(DebugMessage, {
      detail: 'hello world',
    })

    expect(eventSpy).toHaveBeenCalledWith(expectedEvent)
  })
})

describe('isPasslockEvent', () => {
  test('return true for our custom event', () => {
    const passlockEvent = new CustomEvent(DebugMessage, {
      detail: 'hello world',
    })

    expect(isPasslockEvent(passlockEvent)).toBe(true)
  })

  test('return false for other events', () => {
    const otherEvent = new MouseEvent('click')
    expect(isPasslockEvent(otherEvent)).toBe(false)
  })
})

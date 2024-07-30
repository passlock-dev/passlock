import { Effect as E, Layer, pipe } from 'effect'
import { mock } from 'vitest-mock-extended'
import { BrowserStorage, StorageServiceLive } from './storage.js'

const storageTest = Layer.effect(
  BrowserStorage,
  E.sync(() => mock<Storage>()),
)

export const testLayers = (storage: Layer.Layer<BrowserStorage> = storageTest) => {
  const storageService = pipe(StorageServiceLive, Layer.provide(storage))
  return Layer.merge(storage, storageService)
}

export { principal } from '../test/fixtures.js'

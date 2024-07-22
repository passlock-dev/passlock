import { Effect as E, Layer, pipe } from 'effect'
import { mock } from 'vitest-mock-extended'
import { Storage, StorageServiceLive } from './storage.js'

const storageTest = Layer.effect(
  Storage,
  E.sync(() => mock<Storage>()),
)

export const testLayers = (storage: Layer.Layer<Storage> = storageTest) => {
  const storageService = pipe(StorageServiceLive, Layer.provide(storage))

  return Layer.merge(storage, storageService)
}

export { principal } from '../test/fixtures.js'

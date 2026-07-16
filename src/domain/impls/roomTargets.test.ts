import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveRoomSendTargets } from './roomTargets.ts'

test('broadcasts to every connected room peer when no target is specified', () => {
  assert.deepEqual(resolveRoomSendTargets(undefined, ['peer-a', 'peer-b']), ['peer-a', 'peer-b'])
})

test('keeps explicit private-message targets unchanged', () => {
  assert.deepEqual(resolveRoomSendTargets('peer-b', ['peer-a', 'peer-b']), ['peer-b'])
  assert.deepEqual(resolveRoomSendTargets(['peer-a', 'peer-b'], ['peer-c']), ['peer-a', 'peer-b'])
})

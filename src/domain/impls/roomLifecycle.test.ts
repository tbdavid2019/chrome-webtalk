import assert from 'node:assert/strict'
import test from 'node:test'

import { leaveAttachedRoom } from './roomLifecycle.ts'

test('does not defer a leave when no room has been attached yet', () => {
  assert.equal(leaveAttachedRoom(undefined), false)
})

test('leaves only the room that is attached at cleanup time', () => {
  let leaveCount = 0

  assert.equal(
    leaveAttachedRoom({
      leave: () => {
        leaveCount += 1
      }
    }),
    true
  )
  assert.equal(leaveCount, 1)
})

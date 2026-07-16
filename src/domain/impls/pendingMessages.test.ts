import assert from 'node:assert/strict'
import test from 'node:test'

import { PendingRoomMessages } from './pendingMessages.ts'

test('keeps messages queued per peer until that peer is ready', () => {
  const pending = new PendingRoomMessages()
  pending.enqueue('peer-b', 'message-1')
  pending.enqueue('peer-b', 'message-2')
  pending.enqueue('peer-c', 'message-3')

  assert.deepEqual(pending.drain('peer-b'), ['message-1', 'message-2'])
  assert.deepEqual(pending.drain('peer-b'), [])
  assert.deepEqual(pending.drain('peer-c'), ['message-3'])
})

test('drops pending messages when a peer leaves', () => {
  const pending = new PendingRoomMessages()
  pending.enqueue('peer-b', 'message-1')

  pending.remove('peer-b')

  assert.deepEqual(pending.drain('peer-b'), [])
})

test('keeps a broadcast queued when no peer is ready yet', () => {
  const pending = new PendingRoomMessages()
  pending.enqueueBroadcast('message-before-peer-open')

  assert.deepEqual(pending.drainBroadcast(), ['message-before-peer-open'])
  assert.deepEqual(pending.drainBroadcast(), [])
})

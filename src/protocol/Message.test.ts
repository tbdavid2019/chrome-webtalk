import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { isProtocolNetworkMessage, MESSAGE_TYPE } from './Message.ts'

test('accepts a recall control message at the protocol boundary', () => {
  assert.equal(
    isProtocolNetworkMessage({
      type: MESSAGE_TYPE.RECALL,
      id: 'recall-1',
      targetId: 'message-1',
      hlc: { timestamp: 2_000, counter: 1 },
      sentAt: 2_000,
      receivedAt: 2_000,
      sender: { id: 'user-1', name: 'Alice', avatar: '' }
    }),
    true
  )
})

test('accepts a recalled text tombstone in history payloads', () => {
  assert.equal(
    isProtocolNetworkMessage({
      type: MESSAGE_TYPE.TEXT,
      id: 'message-1',
      recalledAt: 2_000,
      hlc: { timestamp: 1_000, counter: 0 },
      sentAt: 1_000,
      receivedAt: 2_000,
      sender: { id: 'user-1', name: 'Alice', avatar: '' },
      body: '',
      mentions: [],
      reactions: { likes: [], hates: [] }
    }),
    true
  )
})

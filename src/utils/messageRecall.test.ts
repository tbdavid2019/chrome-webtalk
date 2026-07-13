import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { canRecallMessage, isRecalledMessage, recallMessage, MESSAGE_RECALL_WINDOW_MS } from './messageRecall.ts'

const createMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'message-1',
  userId: 'user-1',
  sendTime: 1_000,
  receiveTime: 1_000,
  body: 'hello',
  atUsers: [{ userId: 'user-2' }],
  likeUsers: [{ userId: 'user-3' }],
  hateUsers: [{ userId: 'user-4' }],
  pageContext: { url: 'https://example.com', title: 'Example' },
  ...overrides
})

test('allows the message owner to recall within the time window', () => {
  assert.equal(canRecallMessage(createMessage(), 'user-1', 1_000 + MESSAGE_RECALL_WINDOW_MS), true)
})

test('rejects recalls from another user or after the time window', () => {
  const message = createMessage()

  assert.equal(canRecallMessage(message, 'user-2', 1_001), false)
  assert.equal(canRecallMessage(message, 'user-1', 1_001 + MESSAGE_RECALL_WINDOW_MS), false)
})

test('rejects a message that has already been recalled', () => {
  assert.equal(canRecallMessage(createMessage({ recalledAt: 1_500 }), 'user-1', 1_600), false)
})

test('turns a recalled message into a local tombstone', () => {
  const recalled = recallMessage(createMessage(), 1_500)

  assert.equal(recalled.body, '')
  assert.deepEqual(recalled.atUsers, [])
  assert.deepEqual(recalled.likeUsers, [])
  assert.deepEqual(recalled.hateUsers, [])
  assert.equal(recalled.pageContext, undefined)
  assert.equal((recalled as { recalledAt?: number }).recalledAt, 1_500)
  assert.equal(recalled.receiveTime, 1_500)
})

test('does not treat user-authored recall text as a system recall state', () => {
  assert.equal(isRecalledMessage({ body: '此訊息已撤回' }), false)
  assert.equal(isRecalledMessage({ body: 'original message', recalledAt: 1_500 }), true)
})

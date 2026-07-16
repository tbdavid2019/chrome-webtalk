import assert from 'node:assert/strict'
import test from 'node:test'

import { createRelayUrl } from './WebSocketRelay.ts'

test('builds a secure room-scoped relay URL from the Vercel endpoint', () => {
  assert.equal(
    createRelayUrl('https://webtalk-nine.vercel.app/api/webtalk/ws', 'room 1', 'peer-a'),
    'wss://webtalk-nine.vercel.app/api/webtalk/ws?roomId=room+1&peerId=peer-a'
  )
})

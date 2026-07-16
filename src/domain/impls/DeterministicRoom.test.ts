import assert from 'node:assert/strict'
import test from 'node:test'

import { createRoomCallMetadata, parseRoomCallMetadata, shouldInitiateRoomCall } from './DeterministicRoom.ts'

test('only one side of a peer pair initiates the room call', () => {
  assert.equal(shouldInitiateRoomCall('peer-a', 'peer-b'), true)
  assert.equal(shouldInitiateRoomCall('peer-b', 'peer-a'), false)
  assert.equal(shouldInitiateRoomCall('peer-a', 'peer-a'), false)
})

test('room calls are routed only to their owning room', () => {
  const metadata = createRoomCallMetadata('room-1')
  assert.deepEqual(parseRoomCallMetadata(metadata), { type: 'webtalk-room', roomId: 'room-1' })
  assert.equal(parseRoomCallMetadata('{"type":"other"}'), null)
  assert.equal(parseRoomCallMetadata(undefined), null)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import EventHub from '@resreq/event-hub'

import {
  createRoomCallMetadata,
  DeterministicRoom,
  parseRoomCallMetadata,
  shouldInitiateRoomCall
} from './DeterministicRoom.ts'

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

test('tracks a signaling peer before its WebRTC call is open', () => {
  const signaling = new EventHub() as any
  signaling.join = () => undefined
  const peer = {
    id: 'peer-b',
    on: () => undefined,
    off: () => undefined
  } as any
  const room = new DeterministicRoom({ peer, signaling, roomId: 'room-1' })
  const discovered: string[] = []

  room.on('discover', (peerId: string) => discovered.push(peerId))
  signaling.emit('join', 'room-1', 'peer-a')

  assert.deepEqual(room.members, ['peer-a'])
  assert.deepEqual(room.peers, [])
  assert.deepEqual(discovered, ['peer-a'])

  room.leave()
  assert.deepEqual(room.members, [])
})

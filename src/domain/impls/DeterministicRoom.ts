import EventHub from '@resreq/event-hub'
import type { SocketSignaling } from '@rtco/client'

import type Peer from './Peer'

interface RoomCallMetadata {
  type: 'webtalk-room'
  roomId: string
}

type RoomCall = ReturnType<Peer['call']>

export const shouldInitiateRoomCall = (selfPeerId: string, remotePeerId: string): boolean =>
  selfPeerId !== remotePeerId && selfPeerId.localeCompare(remotePeerId) < 0

export const createRoomCallMetadata = (roomId: string): string =>
  JSON.stringify({ type: 'webtalk-room', roomId } satisfies RoomCallMetadata)

export const parseRoomCallMetadata = (metadata: string | undefined): RoomCallMetadata | null => {
  if (!metadata) return null

  try {
    const value = JSON.parse(metadata) as Partial<RoomCallMetadata>
    return value.type === 'webtalk-room' && typeof value.roomId === 'string'
      ? { type: 'webtalk-room', roomId: value.roomId }
      : null
  } catch {
    return null
  }
}

export class DeterministicRoom extends EventHub {
  readonly id: string
  private readonly peer: Peer
  private readonly signaling: SocketSignaling
  private readonly calls = new Map<string, RoomCall>()
  private readonly memberPeerIds = new Set<string>()
  private readonly readyPeerIds = new Set<string>()
  private closed = false

  constructor({ peer, signaling, roomId }: { peer: Peer; signaling: SocketSignaling; roomId: string }) {
    super()
    this.peer = peer
    this.signaling = signaling
    this.id = roomId

    this.peer.on('call', this.handleIncomingCall)
    this.signaling.on('join', this.handleRoomMember)
    this.signaling.on('disconnect', this.handleDisconnect)
    this.signaling.join(roomId)
  }

  get peers(): string[] {
    return [...this.readyPeerIds]
  }

  get members(): string[] {
    return [...this.memberPeerIds]
  }

  send(message: string, target?: string | string[]): void {
    const targetPeerIds = target ? (Array.isArray(target) ? target : [target]) : this.peers

    targetPeerIds.forEach((peerId) => {
      const call = this.calls.get(peerId)
      if (!call || !this.readyPeerIds.has(peerId)) {
        throw new Error('Connection is not established yet.')
      }
      call.send(message)
    })
  }

  leave(): void {
    if (this.closed) return
    this.closed = true

    this.peer.off('call', this.handleIncomingCall)
    this.signaling.off('join', this.handleRoomMember)
    this.signaling.off('disconnect', this.handleDisconnect)
    this.calls.forEach((call) => call.hangup())
    this.calls.clear()
    this.memberPeerIds.clear()
    this.readyPeerIds.clear()
    this.emit('close')
  }

  private readonly handleRoomMember = (roomId: string, remotePeerId: string): void => {
    if (this.closed || roomId !== this.id || this.peer.id === remotePeerId) {
      return
    }

    this.memberPeerIds.add(remotePeerId)
    this.emit('discover', remotePeerId)

    if (!shouldInitiateRoomCall(this.peer.id, remotePeerId) || this.calls.has(remotePeerId)) return

    const call = this.peer.call(remotePeerId, createRoomCallMetadata(this.id))
    this.attachCall(call)
  }

  private readonly handleIncomingCall = (call: RoomCall): void => {
    if (this.closed || parseRoomCallMetadata(call.metadata)?.roomId !== this.id) return

    const existingCall = this.calls.get(call.target)
    if (existingCall && existingCall !== call) {
      call.hangup()
      return
    }

    this.attachCall(call)
    call.answer()
  }

  private attachCall(call: RoomCall): void {
    const remotePeerId = call.target
    this.calls.set(remotePeerId, call)

    call.on('open', () => {
      if (this.closed || this.calls.get(remotePeerId) !== call || this.readyPeerIds.has(remotePeerId)) return
      this.readyPeerIds.add(remotePeerId)
      this.emit('join', remotePeerId)
    })
    call.on('data', (message: string) => {
      if (!this.closed && this.calls.get(remotePeerId) === call) {
        this.emit('message', message, remotePeerId)
      }
    })
    call.on('close', () => this.removeCall(remotePeerId, call))
    call.on('error', (error: Error) => {
      this.emit('error', error)
      this.removeCall(remotePeerId, call)
    })
  }

  private removeCall(remotePeerId: string, call: RoomCall): void {
    if (this.calls.get(remotePeerId) !== call) return

    this.calls.delete(remotePeerId)
    this.memberPeerIds.delete(remotePeerId)
    if (this.readyPeerIds.delete(remotePeerId)) {
      this.emit('leave', remotePeerId)
    }
  }

  private readonly handleDisconnect = (): void => {
    this.leave()
  }
}

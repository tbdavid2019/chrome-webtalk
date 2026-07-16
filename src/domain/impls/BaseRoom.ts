import EventHub from '@resreq/event-hub'
import { JSONR } from '@/utils'
import { DeterministicRoom } from './DeterministicRoom'
import Peer from './Peer'
import { PendingRoomMessages } from './pendingMessages'
import { leaveAttachedRoom } from './roomLifecycle'
import { resolveRoomSendTargets } from './roomTargets'

export interface RoomConfig {
  peer: Peer
  roomId: string
}

export class BaseRoom<M> extends EventHub {
  private static readonly SEND_RETRY_DELAY_MS = 250
  private static readonly MAX_SEND_RETRIES = 4
  readonly peer: Peer
  readonly roomId: string
  readonly peerId: string
  protected room?: DeterministicRoom
  private readonly pendingMessages = new PendingRoomMessages()

  constructor(config: RoomConfig) {
    super()
    this.peer = config.peer
    this.roomId = config.roomId
    this.peerId = config.peer.id
    this.joinRoom = this.joinRoom.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.onMessage = this.onMessage.bind(this)
    this.onJoinRoom = this.onJoinRoom.bind(this)
    this.onLeaveRoom = this.onLeaveRoom.bind(this)
    this.leaveRoom = this.leaveRoom.bind(this)
    this.onError = this.onError.bind(this)
  }

  private readonly handlePeerJoin = (peerId: string): void => {
    this.pendingMessages.drain(peerId).forEach((serializedMessage) => {
      this.sendSerializedMessage(serializedMessage, peerId)
    })
  }

  private readonly handlePeerLeave = (peerId: string): void => {
    this.pendingMessages.remove(peerId)
  }

  private attachRoom(room: DeterministicRoom): void {
    this.room = room
    room.on('join', this.handlePeerJoin)
    room.on('leave', this.handlePeerLeave)
  }

  private detachRoom(): void {
    if (this.room) {
      this.room.off('join', this.handlePeerJoin)
      this.room.off('leave', this.handlePeerLeave)
    }
    this.pendingMessages.clear()
    this.room = undefined
  }

  private sendSerializedMessage(serializedMessage: string, id?: string | string[], retryCount = 0) {
    if (!this.room) {
      this.emit('error', new Error('Connection is not established yet.'))
      return
    }

    const recipientIds = resolveRoomSendTargets(id, this.room.peers)
    if (recipientIds.length === 0) return

    recipientIds.forEach((peerId) => {
      try {
        this.room?.send(serializedMessage, peerId)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const isConnectionNotReady = message.includes('Connection is not established yet.')

        if (isConnectionNotReady) {
          if (retryCount < BaseRoom.MAX_SEND_RETRIES) {
            setTimeout(
              () => {
                this.sendSerializedMessage(serializedMessage, peerId, retryCount + 1)
              },
              BaseRoom.SEND_RETRY_DELAY_MS * (retryCount + 1)
            )
          } else {
            this.pendingMessages.enqueue(peerId, serializedMessage)
          }
          return
        }

        this.emit('error', new Error(`Failed to send message: ${error}`))
      }
    })
  }

  joinRoom() {
    if (this.room) {
      this.emit('action')
    } else {
      if (this.peer.state === 'ready') {
        this.attachRoom(this.peer.joinDeterministicRoom(this.roomId))
        this.emit('action')
      } else {
        this.peer.on('open', () => {
          this.attachRoom(this.peer.joinDeterministicRoom(this.roomId))
          this.emit('action')
        })
      }
    }
    return this
  }

  sendMessage(message: M, id?: string | string[]) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Connection is not established yet.'))
        } else {
          try {
            const serializedMessage = JSONR.stringify(message)
            if (!serializedMessage) {
              this.emit('error', new Error('Failed to serialize message'))
              return
            }
            this.sendSerializedMessage(serializedMessage, id)
          } catch (error) {
            this.emit('error', new Error(`Failed to send message: ${error}`))
          }
        }
      })
    } else {
      if (this.peer.state !== 'ready') {
        this.emit('error', new Error('Connection is not established yet.'))
        return this
      }

      try {
        const serializedMessage = JSONR.stringify(message)
        if (!serializedMessage) {
          this.emit('error', new Error('Failed to serialize message'))
          return this
        }
        this.sendSerializedMessage(serializedMessage, id)
      } catch (error) {
        this.emit('error', new Error(`Failed to send message: ${error}`))
      }
    }
    return this
  }

  onMessage(callback: (message: M) => void) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.on('message', (message: string) => callback(JSONR.parse(message) as M))
        }
      })
    } else {
      this.room.on('message', (message: string) => callback(JSONR.parse(message) as M))
    }
    return this
  }

  onJoinRoom(callback: (id: string) => void) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.on('join', (id: string) => callback(id))
        }
      })
    } else {
      this.room.on('join', (id: string) => callback(id))
    }
    return this
  }

  onLeaveRoom(callback: (id: string) => void) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.on('leave', (id: string) => callback(id))
        }
      })
    } else {
      this.room.on('leave', (id: string) => callback(id))
    }
    return this
  }

  leaveRoom() {
    if (leaveAttachedRoom(this.room)) {
      this.detachRoom()
    }
    return this
  }

  onError(callback: (error: Error) => void) {
    this.peer?.on('error', (error) => callback(error))
    this.on('error', (error: Error) => callback(error))
    return this
  }
}

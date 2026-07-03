import { Room } from '@rtco/client'
import EventHub from '@resreq/event-hub'
import { JSONR } from '@/utils'
import Peer from './Peer'

export interface RoomConfig {
  peer: Peer
  roomId: string
}

export class BaseRoom<M> extends EventHub {
  readonly peer: Peer
  readonly roomId: string
  readonly peerId: string
  protected room?: Room

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

  joinRoom() {
    if (this.room) {
      this.emit('action')
    } else {
      if (this.peer.state === 'ready') {
        this.room = this.peer.join(this.roomId)
        this.emit('action')
      } else {
        this.peer.on('open', () => {
          this.room = this.peer.join(this.roomId)
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
            this.room.send(serializedMessage, id)
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
        this.room.send(serializedMessage, id)
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
          this.room.on('message', (message) => callback(JSONR.parse(message) as M))
        }
      })
    } else {
      this.room.on('message', (message) => callback(JSONR.parse(message) as M))
    }
    return this
  }

  onJoinRoom(callback: (id: string) => void) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.on('join', (id) => callback(id))
        }
      })
    } else {
      this.room.on('join', (id) => callback(id))
    }
    return this
  }

  onLeaveRoom(callback: (id: string) => void) {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.on('leave', (id) => callback(id))
        }
      })
    } else {
      this.room.on('leave', (id) => callback(id))
    }
    return this
  }

  leaveRoom() {
    if (!this.room) {
      this.once('action', () => {
        if (!this.room) {
          this.emit('error', new Error('Room not joined'))
        } else {
          this.room.leave()
          this.room = undefined
        }
      })
    } else {
      this.room.leave()
      this.room = undefined
    }
    return this
  }

  onError(callback: (error: Error) => void) {
    this.peer?.on('error', (error) => callback(error))
    this.on('error', (error: Error) => callback(error))
    return this
  }
}

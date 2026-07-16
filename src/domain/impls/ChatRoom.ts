import { ChatRoomExtern } from '@/domain/externs/ChatRoom'
import { stringToHex } from '@/utils'
import { RoomMessage } from '@/domain/ChatRoom'
import Peer from './Peer'
import { BaseRoom } from './BaseRoom'
import { resolveRoomId, type RoomIdentityOptions } from '@/utils/roomId'
import { WebSocketRelay } from './WebSocketRelay'

class ChatRoom extends BaseRoom<RoomMessage> {}

export interface ChatRoomFactoryOptions extends RoomIdentityOptions {
  peer?: Peer
  relayEndpoint?: string
}

export const createChatRoomImpl = (options: ChatRoomFactoryOptions = {}) => {
  const roomId = options.roomId ?? resolveRoomId(options)
  const peer = options.peer ?? Peer.createInstance()
  const relay = options.relayEndpoint
    ? new WebSocketRelay({ endpoint: options.relayEndpoint, roomId, peerId: peer.id })
    : undefined
  return ChatRoomExtern.impl(new ChatRoom({ roomId, peer, relay }))
}

// Preserve the Extension's existing host-based room identity.
export const ChatRoomImpl = createChatRoomImpl({ roomId: stringToHex(document.location.host) })

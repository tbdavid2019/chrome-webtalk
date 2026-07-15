import { ChatRoomExtern } from '@/domain/externs/ChatRoom'
import { stringToHex } from '@/utils'
import { RoomMessage } from '@/domain/ChatRoom'
import Peer from './Peer'
import { BaseRoom } from './BaseRoom'
import { resolveRoomId, type RoomIdentityOptions } from '@/utils/roomId'

class ChatRoom extends BaseRoom<RoomMessage> {}

export interface ChatRoomFactoryOptions extends RoomIdentityOptions {
  peer?: Peer
}

export const createChatRoomImpl = (options: ChatRoomFactoryOptions = {}) => {
  const roomId = options.roomId ?? resolveRoomId(options)
  const peer = options.peer ?? Peer.createInstance()
  return ChatRoomExtern.impl(new ChatRoom({ roomId, peer }))
}

// Preserve the Extension's existing host-based room identity.
export const ChatRoomImpl = createChatRoomImpl({ roomId: stringToHex(document.location.host) })

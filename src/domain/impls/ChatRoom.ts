import { ChatRoomExtern } from '@/domain/externs/ChatRoom'
import { stringToHex } from '@/utils'
import { RoomMessage } from '@/domain/ChatRoom'
import Peer from './Peer'
import { BaseRoom } from './BaseRoom'

class ChatRoom extends BaseRoom<RoomMessage> {}

const hostRoomId = stringToHex(document.location.host)

const chatRoom = new ChatRoom({ roomId: hostRoomId, peer: Peer.createInstance() })

export const ChatRoomImpl = ChatRoomExtern.impl(chatRoom)

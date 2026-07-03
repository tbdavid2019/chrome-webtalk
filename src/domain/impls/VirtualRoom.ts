import { VirtualRoomExtern } from '@/domain/externs/VirtualRoom'
import { stringToHex } from '@/utils'
import { RoomMessage } from '@/domain/VirtualRoom'
import { VIRTUAL_ROOM_ID } from '@/constants/config'
import Peer from './Peer'
import { BaseRoom } from './BaseRoom'

class VirtualRoom extends BaseRoom<RoomMessage> {}

const hostRoomId = stringToHex(VIRTUAL_ROOM_ID)

const virtualRoom = new VirtualRoom({ roomId: hostRoomId, peer: Peer.createInstance() })

export const VirtualRoomImpl = VirtualRoomExtern.impl(virtualRoom)

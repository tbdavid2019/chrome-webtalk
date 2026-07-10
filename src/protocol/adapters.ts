import type { AtUser, MessageUser, NormalMessage } from '@/domain/MessageList'
import { MessageType } from '@/domain/MessageList'
import type {
  LegacyAiMessageMeta,
  LegacyAtUser,
  LegacyMessageUser,
  LegacyRoomMessage,
  LegacyStoredTextMessage,
  LegacyTextMessage
} from './LegacyChatRoom'
import { LegacySendType } from './LegacyChatRoom'
import type {
  HLC,
  ProtocolHistorySyncMessage,
  ProtocolMention,
  ProtocolNetworkMessage,
  ProtocolPeerSyncMessage,
  ProtocolReactionMessage,
  ProtocolSender,
  ProtocolTextMessage
} from './Message'
import { MESSAGE_TYPE, REACTION_TYPE } from './Message'

export const toProtocolSender = (user: LegacyMessageUser | MessageUser): ProtocolSender => ({
  id: user.userId,
  name: user.username,
  avatar: user.userAvatar
})

export const fromProtocolSender = (sender: ProtocolSender): MessageUser => ({
  userId: sender.id,
  username: sender.name,
  userAvatar: sender.avatar
})

export const toProtocolMention = (mention: LegacyAtUser | AtUser): ProtocolMention => ({
  ...toProtocolSender(mention),
  positions: mention.positions
})

export const fromProtocolMention = (mention: ProtocolMention): AtUser => ({
  ...fromProtocolSender(mention),
  positions: mention.positions
})

export const createPseudoHLC = (timestamp: number): HLC => ({
  timestamp,
  counter: 0
})

export const normalizeLegacyTextMessage = (
  message: LegacyTextMessage,
  reactions?: { likes: LegacyMessageUser[]; hates: LegacyMessageUser[] }
): ProtocolTextMessage => ({
  type: MESSAGE_TYPE.TEXT,
  id: message.id,
  hlc: createPseudoHLC(message.sendTime),
  sentAt: message.sendTime,
  receivedAt: message.sendTime,
  sender: toProtocolSender(message),
  body: message.body,
  mentions: message.atUsers.map(toProtocolMention),
  reactions: {
    likes: (reactions?.likes ?? []).map(toProtocolSender),
    hates: (reactions?.hates ?? []).map(toProtocolSender)
  }
})

export const normalizeLegacyStoredTextMessage = (message: LegacyStoredTextMessage): ProtocolTextMessage =>
  ({
    type: MESSAGE_TYPE.TEXT,
    id: message.id,
    hlc: createPseudoHLC(message.sendTime),
    sentAt: message.sendTime,
    receivedAt: message.receiveTime,
    sender: toProtocolSender(message),
    body: message.body,
    mentions: message.atUsers.map(toProtocolMention),
    reactions: {
      likes: message.likeUsers.map(toProtocolSender),
      hates: message.hateUsers.map(toProtocolSender)
    }
  })

export const normalizeLegacyRoomMessage = (message: LegacyRoomMessage): ProtocolNetworkMessage => {
  switch (message.type) {
    case LegacySendType.Text:
      return normalizeLegacyTextMessage(message)
    case LegacySendType.Like:
      return {
        type: MESSAGE_TYPE.REACTION,
        id: message.id,
        targetId: message.id,
        hlc: createPseudoHLC(message.sendTime),
        sentAt: message.sendTime,
        receivedAt: message.sendTime,
        sender: toProtocolSender(message),
        reaction: REACTION_TYPE.LIKE
      }
    case LegacySendType.Hate:
      return {
        type: MESSAGE_TYPE.REACTION,
        id: message.id,
        targetId: message.id,
        hlc: createPseudoHLC(message.sendTime),
        sentAt: message.sendTime,
        receivedAt: message.sendTime,
        sender: toProtocolSender(message),
        reaction: REACTION_TYPE.HATE
      }
    case LegacySendType.SyncUser:
      return {
        type: MESSAGE_TYPE.PEER_SYNC,
        id: message.id,
        hlc: createPseudoHLC(message.sendTime),
        sentAt: message.sendTime,
        receivedAt: message.sendTime,
        sender: toProtocolSender(message),
        peerId: message.peerId,
        joinedAt: message.joinTime,
        lastMessageHLC: createPseudoHLC(message.lastMessageTime)
      }
    case LegacySendType.SyncHistory:
      return {
        type: MESSAGE_TYPE.HISTORY_SYNC,
        id: message.id,
        hlc: createPseudoHLC(message.sendTime),
        sentAt: message.sendTime,
        receivedAt: message.sendTime,
        sender: toProtocolSender(message),
        messages: message.messages.map(normalizeLegacyStoredTextMessage)
      }
  }
}

export const denormalizeProtocolTextMessage = (
  message: ProtocolTextMessage,
  options?: {
    senderType?: 'user' | 'ai'
    aiMeta?: LegacyAiMessageMeta
    isPrivate?: boolean
    toUser?: MessageUser
  }
): NormalMessage => ({
  ...fromProtocolSender(message.sender),
  type: MessageType.Normal,
  id: message.id,
  body: message.body,
  sendTime: message.sentAt,
  receiveTime: message.receivedAt,
  atUsers: message.mentions.map(fromProtocolMention),
  likeUsers: message.reactions.likes.map(fromProtocolSender),
  hateUsers: message.reactions.hates.map(fromProtocolSender),
  senderType: options?.senderType,
  aiMeta: options?.aiMeta,
  isPrivate: options?.isPrivate,
  toUser: options?.toUser
})

export const toLegacyReactionPayload = (message: ProtocolReactionMessage) => ({
  messageId: message.targetId,
  reaction: message.reaction
})

export const toLegacySyncUserPayload = (message: ProtocolPeerSyncMessage) => ({
  peerId: message.peerId,
  joinTime: message.joinedAt,
  lastMessageTime: message.lastMessageHLC.timestamp,
  ...fromProtocolSender(message.sender)
})

export const toLegacySyncHistoryMessages = (message: ProtocolHistorySyncMessage): NormalMessage[] =>
  message.messages.map((item) => denormalizeProtocolTextMessage(item))

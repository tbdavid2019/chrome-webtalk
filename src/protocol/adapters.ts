import type { AtUser, MessageUser, NormalMessage } from '@/domain/MessageList'
import { MessageType } from '@/domain/MessageList'
import { compareHLC, createHLC } from '@/utils'
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
  ProtocolAiMessageMeta,
  ProtocolHistorySyncMessage,
  ProtocolPeerSyncMessage,
  ProtocolMention,
  ProtocolNetworkMessage,
  ProtocolReactionMessage,
  ProtocolSender,
  ProtocolTextMessageExtension,
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

export const createPseudoHLC = (timestamp: number): HLC => ({ timestamp, counter: 0 })

export const toProtocolAiMessageMeta = (meta: LegacyAiMessageMeta): ProtocolAiMessageMeta => ({
  ownerUserId: meta.ownerUserId,
  ownerUsername: meta.ownerUsername,
  triggerMessageId: meta.triggerMessageId,
  model: meta.model
})

export const fromProtocolAiMessageMeta = (meta: ProtocolAiMessageMeta): LegacyAiMessageMeta => ({
  ownerUserId: meta.ownerUserId,
  ownerUsername: meta.ownerUsername,
  triggerMessageId: meta.triggerMessageId,
  model: meta.model
})

export const createProtocolTextExtension = (input: {
  senderType?: 'user' | 'ai'
  aiMeta?: LegacyAiMessageMeta
  isPrivate?: boolean
  toUser?: LegacyMessageUser | MessageUser
}): ProtocolTextMessageExtension | undefined => {
  const hasSenderType = input.senderType && input.senderType !== 'user'
  const hasAiMeta = !!input.aiMeta
  const hasPrivate = !!(input.isPrivate && input.toUser)

  if (!hasSenderType && !hasAiMeta && !hasPrivate) {
    return undefined
  }

  return {
    namespace: 'chrome-webtalk',
    senderType: input.senderType,
    aiMeta: input.aiMeta ? toProtocolAiMessageMeta(input.aiMeta) : undefined,
    private: hasPrivate && input.toUser ? { toUser: toProtocolSender(input.toUser) } : undefined
  }
}

export const readProtocolTextExtension = (message: ProtocolTextMessage) => {
  if (!message.extension || message.extension.namespace !== 'chrome-webtalk') {
    return null
  }

  return message.extension
}

export const toLegacyTextMessage = (message: ProtocolTextMessage): LegacyTextMessage => {
  const extension = readProtocolTextExtension(message)

  return {
    ...fromProtocolSender(message.sender),
    type: LegacySendType.Text,
    id: message.id,
    body: message.body,
    sendTime: message.sentAt,
    atUsers: message.mentions.map(fromProtocolMention),
    senderType: extension?.senderType,
    aiMeta: extension?.aiMeta ? fromProtocolAiMessageMeta(extension.aiMeta) : undefined,
    isPrivate: !!extension?.private,
    toUser: extension?.private ? fromProtocolSender(extension.private.toUser) : undefined
  }
}

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
  },
  extension: createProtocolTextExtension(message)
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
    },
    extension: createProtocolTextExtension(message)
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
  ...(() => {
    const extension = readProtocolTextExtension(message)
    return {
      ...fromProtocolSender(message.sender),
      type: MessageType.Normal,
      id: message.id,
      body: message.body,
      sendTime: message.sentAt,
      receiveTime: message.receivedAt,
      hlc: message.hlc,
      atUsers: message.mentions.map(fromProtocolMention),
      likeUsers: message.reactions.likes.map(fromProtocolSender),
      hateUsers: message.reactions.hates.map(fromProtocolSender),
      senderType: options?.senderType ?? extension?.senderType,
      aiMeta: options?.aiMeta ?? (extension?.aiMeta ? fromProtocolAiMessageMeta(extension.aiMeta) : undefined),
      isPrivate: options?.isPrivate ?? !!extension?.private,
      toUser: options?.toUser ?? (extension?.private ? fromProtocolSender(extension.private.toUser) : undefined)
    }
  })()
})

export const normalizeNormalMessage = (message: NormalMessage): ProtocolTextMessage => ({
  type: MESSAGE_TYPE.TEXT,
  id: message.id,
  hlc: message.hlc ?? createPseudoHLC(message.sendTime),
  sentAt: message.sendTime,
  receivedAt: message.receiveTime,
  sender: toProtocolSender(message),
  body: message.body,
  mentions: message.atUsers.map(toProtocolMention),
  reactions: {
    likes: message.likeUsers.map(toProtocolSender),
    hates: message.hateUsers.map(toProtocolSender)
  },
  extension: createProtocolTextExtension(message)
})

export const createProtocolPeerSyncMessage = (input: {
  id: string
  sender: MessageUser
  sentAt: number
  hlc: HLC
  peerId: string
  joinedAt: number
  lastMessageHLC: HLC
}): ProtocolPeerSyncMessage => ({
  type: MESSAGE_TYPE.PEER_SYNC,
  id: input.id,
  hlc: input.hlc,
  sentAt: input.sentAt,
  receivedAt: input.sentAt,
  sender: toProtocolSender(input.sender),
  peerId: input.peerId,
  joinedAt: input.joinedAt,
  lastMessageHLC: input.lastMessageHLC
})

export const createProtocolTextMessage = (input: {
  id: string
  sender: MessageUser
  body: string
  mentions: AtUser[]
  sentAt: number
  hlc: HLC
  senderType?: 'user' | 'ai'
  aiMeta?: LegacyAiMessageMeta
  isPrivate?: boolean
  toUser?: MessageUser
}): ProtocolTextMessage => ({
  type: MESSAGE_TYPE.TEXT,
  id: input.id,
  hlc: input.hlc,
  sentAt: input.sentAt,
  receivedAt: input.sentAt,
  sender: toProtocolSender(input.sender),
  body: input.body,
  mentions: input.mentions.map(toProtocolMention),
  reactions: {
    likes: [],
    hates: []
  },
  extension: createProtocolTextExtension(input)
})

export const createProtocolHistorySyncMessage = (input: {
  id: string
  sender: MessageUser
  sentAt: number
  hlc: HLC
  messages: NormalMessage[]
}): ProtocolHistorySyncMessage => ({
  type: MESSAGE_TYPE.HISTORY_SYNC,
  id: input.id,
  hlc: input.hlc,
  sentAt: input.sentAt,
  receivedAt: input.sentAt,
  sender: toProtocolSender(input.sender),
  messages: input.messages.map(normalizeNormalMessage)
})

export const createProtocolReactionMessage = (input: {
  id: string
  sender: MessageUser
  sentAt: number
  hlc: HLC
  targetId: string
  reaction: 'like' | 'hate'
}): ProtocolReactionMessage => ({
  type: MESSAGE_TYPE.REACTION,
  id: input.id,
  hlc: input.hlc,
  sentAt: input.sentAt,
  receivedAt: input.sentAt,
  sender: toProtocolSender(input.sender),
  targetId: input.targetId,
  reaction: input.reaction === 'like' ? REACTION_TYPE.LIKE : REACTION_TYPE.HATE
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

export const compareMessageHLC = (a: NormalMessage, b: NormalMessage): number => {
  const aHLC = a.hlc ?? createHLC()
  const bHLC = b.hlc ?? createHLC()
  const hlcCompare = compareHLC(aHLC, bHLC)

  if (hlcCompare !== 0) {
    return hlcCompare
  }

  return a.sendTime - b.sendTime
}

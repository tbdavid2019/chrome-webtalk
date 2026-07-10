import * as v from 'valibot'

export const MESSAGE_TYPE = {
  TEXT: 'text',
  REACTION: 'reaction',
  PEER_SYNC: 'peer-sync',
  HISTORY_SYNC: 'history-sync',
  SYSTEM_PROMPT: 'system-prompt'
} as const

export const REACTION_TYPE = {
  LIKE: 'like',
  HATE: 'hate'
} as const

export interface HLC {
  timestamp: number
  counter: number
}

export interface ProtocolSender {
  id: string
  name: string
  avatar: string
}

export interface ProtocolAiMessageMeta {
  ownerUserId: string
  ownerUsername: string
  triggerMessageId: string
  model?: string
}

export interface ProtocolTextMessageExtension {
  namespace: 'chrome-webtalk'
  senderType?: 'user' | 'ai'
  aiMeta?: ProtocolAiMessageMeta
  private?: {
    toUser: ProtocolSender
  }
}

export interface ProtocolMention extends ProtocolSender {
  positions: [number, number][]
}

export interface ProtocolMessageMeta {
  id: string
  hlc: HLC
  sentAt: number
  receivedAt: number
  sender: ProtocolSender
}

export interface ProtocolTextMessage extends ProtocolMessageMeta {
  type: typeof MESSAGE_TYPE.TEXT
  body: string
  mentions: ProtocolMention[]
  reactions: {
    likes: ProtocolSender[]
    hates: ProtocolSender[]
  }
  extension?: ProtocolTextMessageExtension
}

export interface ProtocolReactionMessage extends ProtocolMessageMeta {
  type: typeof MESSAGE_TYPE.REACTION
  targetId: string
  reaction: (typeof REACTION_TYPE)[keyof typeof REACTION_TYPE]
}

export interface ProtocolPeerSyncMessage extends ProtocolMessageMeta {
  type: typeof MESSAGE_TYPE.PEER_SYNC
  peerId: string
  joinedAt: number
  lastMessageHLC: HLC
}

export interface ProtocolHistorySyncMessage extends ProtocolMessageMeta {
  type: typeof MESSAGE_TYPE.HISTORY_SYNC
  messages: ProtocolTextMessage[]
}

export type ProtocolNetworkMessage =
  | ProtocolTextMessage
  | ProtocolReactionMessage
  | ProtocolPeerSyncMessage
  | ProtocolHistorySyncMessage

const HLCSchema = v.object({
  timestamp: v.number(),
  counter: v.number()
})

const SenderSchema = v.object({
  id: v.string(),
  name: v.string(),
  avatar: v.string()
})

const MentionSchema = v.object({
  id: v.string(),
  name: v.string(),
  avatar: v.string(),
  positions: v.array(v.tuple([v.number(), v.number()]))
})

const AiMessageMetaSchema = v.object({
  ownerUserId: v.string(),
  ownerUsername: v.string(),
  triggerMessageId: v.string(),
  model: v.optional(v.string())
})

const ProtocolTextMessageExtensionSchema: v.GenericSchema<ProtocolTextMessageExtension> = v.object({
  namespace: v.literal('chrome-webtalk'),
  senderType: v.optional(v.union([v.literal('user'), v.literal('ai')])),
  aiMeta: v.optional(AiMessageMetaSchema),
  private: v.optional(
    v.object({
      toUser: SenderSchema
    })
  )
})

const MessageMetaSchema = {
  id: v.string(),
  hlc: HLCSchema,
  sentAt: v.number(),
  receivedAt: v.number(),
  sender: SenderSchema
}

const ProtocolTextMessageSchema: v.GenericSchema<ProtocolTextMessage> = v.object({
  ...MessageMetaSchema,
  type: v.literal(MESSAGE_TYPE.TEXT),
  body: v.string(),
  mentions: v.array(MentionSchema),
  reactions: v.object({
    likes: v.array(SenderSchema),
    hates: v.array(SenderSchema)
  }),
  extension: v.optional(ProtocolTextMessageExtensionSchema)
})

const ProtocolReactionMessageSchema: v.GenericSchema<ProtocolReactionMessage> = v.object({
  ...MessageMetaSchema,
  type: v.literal(MESSAGE_TYPE.REACTION),
  targetId: v.string(),
  reaction: v.union([v.literal(REACTION_TYPE.LIKE), v.literal(REACTION_TYPE.HATE)])
})

const ProtocolPeerSyncMessageSchema: v.GenericSchema<ProtocolPeerSyncMessage> = v.object({
  ...MessageMetaSchema,
  type: v.literal(MESSAGE_TYPE.PEER_SYNC),
  peerId: v.string(),
  joinedAt: v.number(),
  lastMessageHLC: HLCSchema
})

const ProtocolHistorySyncMessageSchema: v.GenericSchema<ProtocolHistorySyncMessage> = v.object({
  ...MessageMetaSchema,
  type: v.literal(MESSAGE_TYPE.HISTORY_SYNC),
  messages: v.array(ProtocolTextMessageSchema)
})

const ProtocolNetworkMessageSchema = v.union([
  ProtocolTextMessageSchema,
  ProtocolReactionMessageSchema,
  ProtocolPeerSyncMessageSchema,
  ProtocolHistorySyncMessageSchema
])

export const isProtocolNetworkMessage = (message: unknown): message is ProtocolNetworkMessage =>
  v.safeParse(ProtocolNetworkMessageSchema, message).success

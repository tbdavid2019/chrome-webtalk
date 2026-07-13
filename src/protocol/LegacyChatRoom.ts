import * as v from 'valibot'

export enum LegacySendType {
  Like = 'Like',
  Hate = 'Hate',
  Recall = 'Recall',
  Text = 'Text',
  SyncUser = 'SyncUser',
  SyncHistory = 'SyncHistory'
}

export interface LegacyMessageUser {
  userId: string
  username: string
  userAvatar: string
}

export interface LegacyAtUser extends LegacyMessageUser {
  positions: [number, number][]
}

export interface LegacyAiMessageMeta {
  ownerUserId: string
  ownerUsername: string
  triggerMessageId: string
  model?: string
}

export interface LegacyPageContext {
  url: string
  title?: string
}

export interface LegacySyncUserMessage extends LegacyMessageUser {
  type: LegacySendType.SyncUser
  id: string
  peerId: string
  joinTime: number
  sendTime: number
  lastMessageTime: number
}

export interface LegacySyncHistoryMessage extends LegacyMessageUser {
  type: LegacySendType.SyncHistory
  sendTime: number
  id: string
  messages: LegacyStoredTextMessage[]
}

export interface LegacyLikeMessage extends LegacyMessageUser {
  type: LegacySendType.Like
  sendTime: number
  id: string
}

export interface LegacyHateMessage extends LegacyMessageUser {
  type: LegacySendType.Hate
  sendTime: number
  id: string
}

export interface LegacyRecallMessage extends LegacyMessageUser {
  type: LegacySendType.Recall
  sendTime: number
  id: string
  targetId: string
}

export interface LegacyTextMessage extends LegacyMessageUser {
  type: LegacySendType.Text
  id: string
  body: string
  sendTime: number
  atUsers: LegacyAtUser[]
  senderType?: 'user' | 'ai'
  aiMeta?: LegacyAiMessageMeta
  pageContext?: LegacyPageContext
  recalledAt?: number
  isPrivate?: boolean
  toUser?: LegacyMessageUser
}

export interface LegacyStoredTextMessage extends LegacyMessageUser {
  type: 'normal'
  id: string
  body: string
  sendTime: number
  receiveTime: number
  atUsers: LegacyAtUser[]
  likeUsers: LegacyMessageUser[]
  hateUsers: LegacyMessageUser[]
  senderType?: 'user' | 'ai'
  aiMeta?: LegacyAiMessageMeta
  pageContext?: LegacyPageContext
  recalledAt?: number
  isPrivate?: boolean
  toUser?: LegacyMessageUser
}

export type LegacyRoomMessage =
  | LegacySyncUserMessage
  | LegacySyncHistoryMessage
  | LegacyLikeMessage
  | LegacyHateMessage
  | LegacyRecallMessage
  | LegacyTextMessage

const LegacyMessageUserSchema = {
  userId: v.string(),
  username: v.string(),
  userAvatar: v.string()
}

const LegacyAtUserSchema = {
  positions: v.array(v.tuple([v.number(), v.number()])),
  ...LegacyMessageUserSchema
}

const LegacyAiMessageMetaSchema = {
  ownerUserId: v.string(),
  ownerUsername: v.string(),
  triggerMessageId: v.string(),
  model: v.optional(v.string())
}

const LegacyPageContextSchema = {
  url: v.string(),
  title: v.optional(v.string())
}

const LegacyStoredTextMessageSchema = v.object({
  id: v.string(),
  type: v.literal('normal'),
  body: v.string(),
  sendTime: v.number(),
  receiveTime: v.number(),
  likeUsers: v.array(v.object(LegacyMessageUserSchema)),
  hateUsers: v.array(v.object(LegacyMessageUserSchema)),
  atUsers: v.array(v.object(LegacyAtUserSchema)),
  senderType: v.optional(v.union([v.literal('user'), v.literal('ai')])),
  aiMeta: v.optional(v.object(LegacyAiMessageMetaSchema)),
  pageContext: v.optional(v.object(LegacyPageContextSchema)),
  recalledAt: v.optional(v.number()),
  isPrivate: v.optional(v.boolean()),
  toUser: v.optional(v.object(LegacyMessageUserSchema)),
  ...LegacyMessageUserSchema
})

const LegacyRoomMessageSchema = v.union([
  v.object({
    type: v.literal(LegacySendType.Text),
    id: v.string(),
    body: v.string(),
    sendTime: v.number(),
    atUsers: v.array(v.object(LegacyAtUserSchema)),
    senderType: v.optional(v.union([v.literal('user'), v.literal('ai')])),
    aiMeta: v.optional(v.object(LegacyAiMessageMetaSchema)),
    pageContext: v.optional(v.object(LegacyPageContextSchema)),
    recalledAt: v.optional(v.number()),
    isPrivate: v.optional(v.boolean()),
    toUser: v.optional(v.object(LegacyMessageUserSchema)),
    ...LegacyMessageUserSchema
  }),
  v.object({
    type: v.literal(LegacySendType.Like),
    id: v.string(),
    sendTime: v.number(),
    ...LegacyMessageUserSchema
  }),
  v.object({
    type: v.literal(LegacySendType.Hate),
    id: v.string(),
    sendTime: v.number(),
    ...LegacyMessageUserSchema
  }),
  v.object({
    type: v.literal(LegacySendType.Recall),
    id: v.string(),
    targetId: v.string(),
    sendTime: v.number(),
    ...LegacyMessageUserSchema
  }),
  v.object({
    type: v.literal(LegacySendType.SyncUser),
    id: v.string(),
    peerId: v.string(),
    joinTime: v.number(),
    sendTime: v.number(),
    lastMessageTime: v.number(),
    ...LegacyMessageUserSchema
  }),
  v.object({
    type: v.literal(LegacySendType.SyncHistory),
    id: v.string(),
    sendTime: v.number(),
    messages: v.array(LegacyStoredTextMessageSchema),
    ...LegacyMessageUserSchema
  })
])

export const isLegacyRoomMessage = (message: unknown): message is LegacyRoomMessage =>
  v.safeParse(LegacyRoomMessageSchema, message).success

export const MESSAGE_RECALL_WINDOW_MS = 2 * 60 * 1000

export interface RecallableMessage {
  userId: string
  sendTime: number
  receiveTime: number
  body: string
  atUsers: unknown[]
  likeUsers: unknown[]
  hateUsers: unknown[]
  pageContext?: unknown
  recalledAt?: number
}

export const isRecalledMessage = (message: { recalledAt?: number; body?: unknown }): boolean =>
  message.recalledAt !== undefined

export const canRecallMessage = (message: RecallableMessage, actorId: string, now: number): boolean => {
  if (message.userId !== actorId || isRecalledMessage(message)) return false
  if (now < message.sendTime) return false
  return now - message.sendTime <= MESSAGE_RECALL_WINDOW_MS
}

export const recallMessage = <T extends RecallableMessage>(message: T, recalledAt: number): T =>
  ({
    ...message,
    body: '',
    atUsers: [],
    likeUsers: [],
    hateUsers: [],
    pageContext: undefined,
    recalledAt,
    receiveTime: recalledAt
  }) as T

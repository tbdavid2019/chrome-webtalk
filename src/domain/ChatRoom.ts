import { Remesh } from 'remesh'
import { map, merge, of, EMPTY, mergeMap, fromEventPattern } from 'rxjs'
import { AtUser, NormalMessage, type MessageUser } from './MessageList'
import { ChatRoomExtern } from '@/domain/externs/ChatRoom'
import MessageListDomain, { MessageType } from '@/domain/MessageList'
import UserInfoDomain from '@/domain/UserInfo'
import { desert, getTextByteSize, upsert } from '@/utils'
import { nanoid } from 'nanoid'
import StatusModule from '@/domain/modules/Status'
import { SYNC_HISTORY_MAX_DAYS, WEB_RTC_MAX_MESSAGE_SIZE, SYNC_MESSAGES_BATCH_SIZE, SYNC_BATCH_DELAY_MS, SYNC_MESSAGE_DELAY_MS } from '@/constants/config'
import * as v from 'valibot'

export { MessageType }

export enum SendType {
  Like = 'Like',
  Hate = 'Hate',
  Text = 'Text',
  SyncUser = 'SyncUser',
  SyncHistory = 'SyncHistory'
}

export interface SyncUserMessage extends MessageUser {
  type: SendType.SyncUser
  id: string
  peerId: string
  joinTime: number
  sendTime: number
  lastMessageTime: number
}

export interface SyncHistoryMessage extends MessageUser {
  type: SendType.SyncHistory
  sendTime: number
  id: string
  messages: NormalMessage[]
}

export interface LikeMessage extends MessageUser {
  type: SendType.Like
  sendTime: number
  id: string
}

export interface HateMessage extends MessageUser {
  type: SendType.Hate
  sendTime: number
  id: string
}

export interface TextMessage extends MessageUser {
  type: SendType.Text
  id: string
  body: string
  sendTime: number
  atUsers: AtUser[]
}

export type RoomMessage = SyncUserMessage | SyncHistoryMessage | LikeMessage | HateMessage | TextMessage

export type RoomUser = MessageUser & { peerIds: string[]; joinTime: number }

const MessageUserSchema = {
  userId: v.string(),
  username: v.string(),
  userAvatar: v.string()
}

const AtUserSchema = {
  positions: v.array(v.tuple([v.number(), v.number()])),
  ...MessageUserSchema
}

const NormalMessageSchema = {
  id: v.string(),
  type: v.literal(MessageType.Normal),
  body: v.string(),
  sendTime: v.number(),
  receiveTime: v.number(),
  likeUsers: v.array(v.object(MessageUserSchema)),
  hateUsers: v.array(v.object(MessageUserSchema)),
  atUsers: v.array(v.object(AtUserSchema)),
  ...MessageUserSchema
}

const RoomMessageSchema = v.union([
  v.object({
    type: v.literal(SendType.Text),
    id: v.string(),
    body: v.string(),
    sendTime: v.number(),
    atUsers: v.array(v.object(AtUserSchema)),
    ...MessageUserSchema
  }),
  v.object({
    type: v.literal(SendType.Like),
    id: v.string(),
    sendTime: v.number(),
    ...MessageUserSchema
  }),
  v.object({
    type: v.literal(SendType.Hate),
    id: v.string(),
    sendTime: v.number(),
    ...MessageUserSchema
  }),
  v.object({
    type: v.literal(SendType.SyncUser),
    id: v.string(),
    peerId: v.string(),
    joinTime: v.number(),
    sendTime: v.number(),
    lastMessageTime: v.number(),
    ...MessageUserSchema
  }),
  v.object({
    type: v.literal(SendType.SyncHistory),
    id: v.string(),
    sendTime: v.number(),
    messages: v.array(v.object(NormalMessageSchema)),
    ...MessageUserSchema
  })
])

// Check if the message conforms to the format
const checkMessageFormat = (message: v.InferInput<typeof RoomMessageSchema>) =>
  v.safeParse(RoomMessageSchema, message).success

const ChatRoomDomain = Remesh.domain({
  name: 'ChatRoomDomain',
  impl: (domain) => {
    const messageListDomain = domain.getDomain(MessageListDomain())
    const userInfoDomain = domain.getDomain(UserInfoDomain())
    const chatRoomExtern = domain.getExtern(ChatRoomExtern)

    const PeerIdState = domain.state<string>({
      name: 'Room.PeerIdState',
      default: chatRoomExtern.peerId
    })

    const PeerIdQuery = domain.query({
      name: 'Room.PeerIdQuery',
      impl: ({ get }) => {
        return get(PeerIdState())
      }
    })

    const JoinStatusModule = StatusModule(domain, {
      name: 'Room.JoinStatusModule'
    })

    const UserListState = domain.state<RoomUser[]>({
      name: 'Room.UserListState',
      default: []
    })

    const UserListQuery = domain.query({
      name: 'Room.UserListQuery',
      impl: ({ get }) => {
        return get(UserListState())
      }
    })

    const SelfUserQuery = domain.query({
      name: 'Room.SelfUserQuery',
      impl: ({ get }) => {
        const user = get(UserListQuery()).find((user) => user.peerIds.includes(chatRoomExtern.peerId))
        if (!user) {
          console.error('SelfUser not found in user list. PeerId:', chatRoomExtern.peerId, 'UserList:', get(UserListQuery()))
          return null
        }
        return user
      }
    })

    const LastMessageTimeQuery = domain.query({
      name: 'Room.LastMessageTimeQuery',
      impl: ({ get }) => {
        return (
          get(messageListDomain.query.ListQuery())
            .filter((message) => message.type === MessageType.Normal)
            .toSorted((a, b) => b.sendTime - a.sendTime)[0]?.sendTime ?? new Date(1970, 1, 1).getTime()
        )
      }
    })

    const JoinIsFinishedQuery = JoinStatusModule.query.IsFinishedQuery

    const JoinRoomCommand = domain.command({
      name: 'Room.JoinRoomCommand',
      impl: ({ get }) => {
        const { id: userId, name: username, avatar: userAvatar } = get(userInfoDomain.query.UserInfoQuery())!
        return [
          UpdateUserListCommand({
            type: 'create',
            user: { peerId: chatRoomExtern.peerId, joinTime: Date.now(), userId, username, userAvatar }
          }),
          // 移除 "joined the chat" 訊息
          JoinStatusModule.command.SetFinishedCommand(),
          JoinRoomEvent(chatRoomExtern.roomId),
          SelfJoinRoomEvent(chatRoomExtern.roomId)
        ]
      }
    })

    JoinRoomCommand.after(() => {
      chatRoomExtern.joinRoom()
      return null
    })

    const LeaveRoomCommand = domain.command({
      name: 'Room.LeaveRoomCommand',
      impl: ({ get }) => {
        const { id: userId, name: username, avatar: userAvatar } = get(userInfoDomain.query.UserInfoQuery())!
        return [
          // 移除 "left the chat" 訊息
          UpdateUserListCommand({
            type: 'delete',
            user: { peerId: chatRoomExtern.peerId, joinTime: Date.now(), userId, username, userAvatar }
          }),
          JoinStatusModule.command.SetInitialCommand(),
          LeaveRoomEvent(chatRoomExtern.roomId),
          SelfLeaveRoomEvent(chatRoomExtern.roomId)
        ]
      }
    })

    LeaveRoomCommand.after(() => {
      chatRoomExtern.leaveRoom()
      return null
    })

    const SendTextMessageCommand = domain.command({
      name: 'Room.SendTextMessageCommand',
      impl: ({ get }, message: string | { body: string; atUsers: AtUser[] }) => {
        const self = get(SelfUserQuery())
        
        // 檢查用戶是否已經加入房間
        if (!self) {
          console.error('Cannot send message: User not joined to room yet')
          return [OnErrorEvent(new Error('Please wait for connection to be established.'))]
        }

        const textMessage: TextMessage = {
          ...self,
          id: nanoid(),
          type: SendType.Text,
          sendTime: Date.now(),
          body: typeof message === 'string' ? message : message.body,
          atUsers: typeof message === 'string' ? [] : message.atUsers
        }

        const listMessage: NormalMessage = {
          ...textMessage,
          type: MessageType.Normal,
          receiveTime: Date.now(),
          likeUsers: [],
          hateUsers: [],
          atUsers: typeof message === 'string' ? [] : message.atUsers
        }

        // 檢查消息大小是否超過 WebRTC 限制
        const messageSize = getTextByteSize(JSON.stringify(textMessage))
        if (messageSize >= WEB_RTC_MAX_MESSAGE_SIZE) {
          console.error('Message too large to send:', messageSize, 'bytes')
          return [OnErrorEvent(new Error('Message size cannot exceed 256KiB.'))]
        }

        try {
          chatRoomExtern.sendMessage(textMessage)
          return [messageListDomain.command.CreateItemCommand(listMessage), SendTextMessageEvent(textMessage)]
        } catch (error) {
          console.error('Failed to send message:', error)
          // 發送錯誤事件給用戶界面
          return [OnErrorEvent(error instanceof Error ? error : new Error(String(error)))]
        }
      }
    })

    const SendLikeMessageCommand = domain.command({
      name: 'Room.SendLikeMessageCommand',
      impl: ({ get }, messageId: string) => {
        const self = get(SelfUserQuery())
        if (!self) {
          console.error('Cannot send like: User not joined to room yet')
          return []
        }
        
        const localMessage = get(messageListDomain.query.ItemQuery(messageId)) as NormalMessage

        const likeMessage: LikeMessage = {
          ...self,
          id: messageId,
          sendTime: Date.now(),
          type: SendType.Like
        }
        const listMessage: NormalMessage = {
          ...localMessage,
          likeUsers: desert(localMessage.likeUsers, likeMessage, 'userId')
        }
        chatRoomExtern.sendMessage(likeMessage)
        return [messageListDomain.command.UpdateItemCommand(listMessage), SendLikeMessageEvent(likeMessage)]
      }
    })

    const SendHateMessageCommand = domain.command({
      name: 'Room.SendHateMessageCommand',
      impl: ({ get }, messageId: string) => {
        const self = get(SelfUserQuery())
        if (!self) {
          console.error('Cannot send hate: User not joined to room yet')
          return []
        }
        
        const localMessage = get(messageListDomain.query.ItemQuery(messageId)) as NormalMessage

        const hateMessage: HateMessage = {
          ...self,
          id: messageId,
          sendTime: Date.now(),
          type: SendType.Hate
        }
        const listMessage: NormalMessage = {
          ...localMessage,
          hateUsers: desert(localMessage.hateUsers, hateMessage, 'userId')
        }
        chatRoomExtern.sendMessage(hateMessage)
        return [messageListDomain.command.UpdateItemCommand(listMessage), SendHateMessageEvent(hateMessage)]
      }
    })

    const SendSyncUserMessageCommand = domain.command({
      name: 'Room.SendSyncUserMessageCommand',
      impl: ({ get }, peerId: string) => {
        const self = get(SelfUserQuery())
        if (!self) {
          console.error('Cannot send sync user message: User not joined to room yet')
          return []
        }
        
        const lastMessageTime = get(LastMessageTimeQuery())

        const syncUserMessage: SyncUserMessage = {
          ...self,
          id: nanoid(),
          peerId: chatRoomExtern.peerId,
          sendTime: Date.now(),
          lastMessageTime,
          type: SendType.SyncUser
        }

        chatRoomExtern.sendMessage(syncUserMessage, peerId)
        return [SendSyncUserMessageEvent(syncUserMessage)]
      }
    })

    /**
     * The maximum sync message is the historical records within 30 days, using the last message as the basis for judgment.
     * The number of synced messages may not be all messages within 30 days; if new messages are generated before syncing, they will not be synced.
     * Users A, B, C, D, and E: A and B are online, while C, D, and E are offline.
     * 1. A and B chat, generating two messages: messageA and messageB.
     * 2. A and B go offline.
     * 3. C and D come online, generating two messages: messageC and messageD.
     * 4. A and B come online, and C and D will push two messages, messageC and messageD, to A and B. However, A and B will not push messageA and messageB to C and D because C and D's latest message timestamps are earlier than A and B's.
     * 5. E comes online, and A, B, C, and D will all push messages messageA, messageB, messageC, and messageD to E.
     *
     * Final results:
     * A and B see 4 messages: messageC, messageD, messageA, and messageB.
     * C and D see 2 messages: messageA and messageB.
     * E sees 4 messages: messageA, messageB, messageC, and messageD.
     *
     * As shown above, C and D did not sync messages that were earlier than their own.
     * On one hand, if we want to fully sync 30 days of messages, we must diff the timestamps of messages within 30 days and then insert them. The current implementation only does incremental additions, and messages will accumulate over time.
     * For now, let's keep it this way and see if it's necessary to fully sync the data within 30 days later.
     */
    const SendSyncHistoryMessageCommand = domain.command({
      name: 'Room.SendSyncHistoryMessageCommand',
      impl: ({ get }, { peerId, lastMessageTime }: { peerId: string; lastMessageTime: number }) => {
        const self = get(SelfUserQuery())
        if (!self) {
          console.error('Cannot send history sync: User not joined to room yet')
          return []
        }

        const historyMessages = get(messageListDomain.query.ListQuery()).filter(
          (message) =>
            message.type === MessageType.Normal &&
            message.sendTime > lastMessageTime &&
            message.sendTime - Date.now() <= SYNC_HISTORY_MAX_DAYS * 24 * 60 * 60 * 1000
        )

        if (historyMessages.length === 0) {
          return []
        }

        console.log(`Syncing ${historyMessages.length} history messages to peer ${peerId}`)

        /**
         * 分批同步歷史消息，避免一次性發送過多消息阻塞連接
         * 每批發送 SYNC_MESSAGES_BATCH_SIZE 條消息，批次間有延遲
         */
        const batches: NormalMessage[][] = []
        for (let i = 0; i < historyMessages.length; i += SYNC_MESSAGES_BATCH_SIZE) {
          batches.push(historyMessages.slice(i, i + SYNC_MESSAGES_BATCH_SIZE) as NormalMessage[])
        }

        const pushHistoryMessageList: SyncHistoryMessage[] = []

        batches.forEach((batch, batchIndex) => {
          // 每個批次內的消息打包成單個 SyncHistoryMessage
          const batchMessage: SyncHistoryMessage = {
            ...self,
            id: nanoid(),
            sendTime: Date.now(),
            type: SendType.SyncHistory,
            messages: batch
          }

          // 檢查批次消息大小
          const batchMessageSize = getTextByteSize(JSON.stringify(batchMessage))
          
          if (batchMessageSize < WEB_RTC_MAX_MESSAGE_SIZE) {
            pushHistoryMessageList.push(batchMessage)
          } else {
            // 如果批次太大，將其分解為更小的批次
            batch.forEach((message) => {
              const singleMessage: SyncHistoryMessage = {
                ...self,
                id: nanoid(),
                sendTime: Date.now(),
                type: SendType.SyncHistory,
                messages: [message]
              }
              
              const singleMessageSize = getTextByteSize(JSON.stringify(singleMessage))
              if (singleMessageSize < WEB_RTC_MAX_MESSAGE_SIZE) {
                pushHistoryMessageList.push(singleMessage)
              } else {
                console.warn('Skipping large message in history sync:', singleMessageSize, 'bytes')
              }
            })
          }
        })

        // 使用延遲發送，避免阻塞主線程和網絡
        return pushHistoryMessageList.map((message, index) => {
          const batchIndex = Math.floor(index / SYNC_MESSAGES_BATCH_SIZE)
          const delay = batchIndex * SYNC_BATCH_DELAY_MS + (index % SYNC_MESSAGES_BATCH_SIZE) * SYNC_MESSAGE_DELAY_MS
          
          setTimeout(() => {
            try {
              chatRoomExtern.sendMessage(message, peerId)
            } catch (error) {
              console.error('Failed to send history message:', error)
            }
          }, delay)
          
          return SendSyncHistoryMessageEvent(message)
        })
      }
    })

    const UpdateUserListCommand = domain.command({
      name: 'Room.UpdateUserListCommand',
      impl: ({ get }, action: { type: 'create' | 'delete'; user: Omit<RoomUser, 'peerIds'> & { peerId: string } }) => {
        const userList = get(UserListState())
        const existUser = userList.find((user) => user.userId === action.user.userId)
        if (action.type === 'create') {
          return [
            UserListState().new(
              upsert(
                userList,
                { ...action.user, peerIds: [...new Set(existUser?.peerIds || []), action.user.peerId] },
                'userId'
              )
            )
          ]
        } else {
          return [
            UserListState().new(
              upsert(
                userList,
                {
                  ...action.user,
                  peerIds: existUser?.peerIds?.filter((peerId) => peerId !== action.user.peerId) || []
                },
                'userId'
              ).filter((user) => user.peerIds.length)
            )
          ]
        }
      }
    })

    const SendSyncHistoryMessageEvent = domain.event<SyncHistoryMessage>({
      name: 'Room.SendSyncHistoryMessageEvent'
    })

    const SendSyncUserMessageEvent = domain.event<SyncUserMessage>({
      name: 'Room.SendSyncUserMessageEvent'
    })

    const SendTextMessageEvent = domain.event<TextMessage>({
      name: 'Room.SendTextMessageEvent'
    })

    const SendLikeMessageEvent = domain.event<LikeMessage>({
      name: 'Room.SendLikeMessageEvent'
    })

    const SendHateMessageEvent = domain.event<HateMessage>({
      name: 'Room.SendHateMessageEvent'
    })

    const JoinRoomEvent = domain.event<string>({
      name: 'Room.JoinRoomEvent'
    })

    const LeaveRoomEvent = domain.event<string>({
      name: 'Room.LeaveRoomEvent'
    })

    const OnMessageEvent = domain.event<RoomMessage>({
      name: 'Room.OnMessageEvent'
    })

    const OnTextMessageEvent = domain.event<TextMessage>({
      name: 'Room.OnTextMessageEvent'
    })

    const OnJoinRoomEvent = domain.event<string>({
      name: 'Room.OnJoinRoomEvent'
    })

    const SelfJoinRoomEvent = domain.event<string>({
      name: 'Room.SelfJoinRoomEvent'
    })

    const OnLeaveRoomEvent = domain.event<string>({
      name: 'Room.OnLeaveRoomEvent'
    })

    const SelfLeaveRoomEvent = domain.event<string>({
      name: 'Room.SelfLeaveRoomEvent'
    })

    const OnErrorEvent = domain.event<Error>({
      name: 'Room.OnErrorEvent'
    })

    domain.effect({
      name: 'Room.OnJoinRoomEffect',
      impl: () => {
        const onJoinRoom$ = fromEventPattern<string>(chatRoomExtern.onJoinRoom).pipe(
          mergeMap((peerId) => {
            // console.log('onJoinRoom', peerId)
            if (chatRoomExtern.peerId === peerId) {
              return [OnJoinRoomEvent(peerId)]
            } else {
              return [SendSyncUserMessageCommand(peerId), OnJoinRoomEvent(peerId)]
            }
          })
        )
        return onJoinRoom$
      }
    })

    domain.effect({
      name: 'Room.OnMessageEffect',
      impl: ({ get }) => {
        const onMessage$ = fromEventPattern<RoomMessage>(chatRoomExtern.onMessage).pipe(
          mergeMap((message) => {
            // Filter out messages that do not conform to the format
            if (!checkMessageFormat(message)) {
              console.warn('Invalid message format', message)
              return EMPTY
            }

            const messageEvent$ = of(OnMessageEvent(message))

            const textMessageEvent$ = of(message.type === SendType.Text ? OnTextMessageEvent(message) : null)

            const messageCommand$ = (() => {
              switch (message.type) {
                case SendType.SyncUser: {
                  const selfUser = get(SelfUserQuery())

                  // If a new user joins after the current user has entered the room, a join log message needs to be created.
                  const existUser = get(UserListQuery()).find((user) => user.userId === message.userId)
                  const isNewJoinUser = !existUser && selfUser && message.joinTime > selfUser.joinTime

                  const lastMessageTime = get(LastMessageTimeQuery())
                  const needSyncHistory = lastMessageTime > message.lastMessageTime

                  return of(
                    UpdateUserListCommand({ type: 'create', user: message }),
                    // 移除 "joined the chat" 訊息
                    null,
                    needSyncHistory && selfUser
                      ? SendSyncHistoryMessageCommand({
                          peerId: message.peerId,
                          lastMessageTime: message.lastMessageTime
                        })
                      : null
                  )
                }

                case SendType.SyncHistory: {
                  return of(...message.messages.map((message) => messageListDomain.command.UpsertItemCommand(message)))
                }

                case SendType.Text:
                  return of(
                    messageListDomain.command.CreateItemCommand({
                      ...message,
                      type: MessageType.Normal,
                      receiveTime: Date.now(),
                      likeUsers: [],
                      hateUsers: []
                    })
                  )
                case SendType.Like:
                case SendType.Hate: {
                  if (!get(messageListDomain.query.HasItemQuery(message.id))) {
                    return EMPTY
                  }
                  const _message = get(messageListDomain.query.ItemQuery(message.id)) as NormalMessage
                  const type = message.type === 'Like' ? 'likeUsers' : 'hateUsers'
                  return of(
                    messageListDomain.command.UpdateItemCommand({
                      ..._message,
                      receiveTime: Date.now(),
                      [type]: desert(
                        _message[type],
                        {
                          userId: message.userId,
                          username: message.username,
                          userAvatar: message.userAvatar
                        },
                        'userId'
                      )
                    })
                  )
                }
                default:
                  console.warn('Unsupported message type', message)
                  return EMPTY
              }
            })()

            return merge(messageEvent$, textMessageEvent$, messageCommand$)
          })
        )
        return onMessage$
      }
    })

    domain.effect({
      name: 'Room.OnLeaveRoomEffect',
      impl: ({ get }) => {
        const onLeaveRoom$ = fromEventPattern<string>(chatRoomExtern.onLeaveRoom).pipe(
          map((peerId) => {
            if (get(JoinStatusModule.query.IsInitialQuery())) {
              return null
            }
            // console.log('onLeaveRoom', peerId)

            const existUser = get(UserListQuery()).find((user) => user.peerIds.includes(peerId))

            if (existUser) {
              return [
                UpdateUserListCommand({ type: 'delete', user: { ...existUser, peerId } }),
                // 移除 "left the chat" 訊息
                null,
                OnLeaveRoomEvent(peerId)
              ]
            } else {
              return [OnLeaveRoomEvent(peerId)]
            }
          })
        )
        return onLeaveRoom$
      }
    })

    domain.effect({
      name: 'Room.OnErrorEffect',
      impl: () => {
        const onRoomError$ = fromEventPattern<Error>(chatRoomExtern.onError).pipe(
          map((error) => {
            console.error(error)
            return OnErrorEvent(error)
          })
        )
        return onRoomError$
      }
    })

    return {
      query: {
        PeerIdQuery,
        UserListQuery,
        JoinIsFinishedQuery
      },
      command: {
        JoinRoomCommand,
        LeaveRoomCommand,
        SendTextMessageCommand,
        SendLikeMessageCommand,
        SendHateMessageCommand,
        SendSyncUserMessageCommand,
        SendSyncHistoryMessageCommand
      },
      event: {
        SendTextMessageEvent,
        SendLikeMessageEvent,
        SendHateMessageEvent,
        SendSyncUserMessageEvent,
        SendSyncHistoryMessageEvent,
        JoinRoomEvent,
        SelfJoinRoomEvent,
        LeaveRoomEvent,
        SelfLeaveRoomEvent,
        OnMessageEvent,
        OnTextMessageEvent,
        OnJoinRoomEvent,
        OnLeaveRoomEvent,
        OnErrorEvent
      }
    }
  }
})

export default ChatRoomDomain

import { Remesh } from 'remesh'
import { map, merge, of, EMPTY, mergeMap, fromEventPattern } from 'rxjs'
import { AiMessageMeta, AtUser, NormalMessage, type MessageUser } from './MessageList'
import { ChatRoomExtern } from '@/domain/externs/ChatRoom'
import MessageListDomain, { MessageType } from '@/domain/MessageList'
import {
  compareMessageHLC,
  createPseudoHLC,
  createProtocolReactionMessage,
  createProtocolTextMessage,
  createProtocolHistorySyncMessage,
  createProtocolPeerSyncMessage,
  denormalizeProtocolTextMessage,
  fromProtocolSender,
  isProtocolNetworkMessage,
  LegacySendType as SendType,
  isLegacyRoomMessage,
  normalizeNormalMessage,
  toLegacyTextMessage,
  type LegacyHateMessage as HateMessage,
  type LegacyLikeMessage as LikeMessage,
  type LegacyRoomMessage,
  type LegacySyncHistoryMessage as SyncHistoryMessage,
  type LegacySyncUserMessage as SyncUserMessage,
  type LegacyTextMessage as TextMessage,
  type ProtocolNetworkMessage
} from '@/protocol'
import UserInfoDomain from '@/domain/UserInfo'
import { compareHLC, createHLC, desert, getTextByteSize, maxHLC, receiveHLCEvent, sendHLCEvent, upsert } from '@/utils'
import { nanoid } from 'nanoid'
import StatusModule from '@/domain/modules/Status'
import {
  SYNC_HISTORY_MAX_DAYS,
  WEB_RTC_MAX_MESSAGE_SIZE,
  SYNC_MESSAGES_BATCH_SIZE,
  SYNC_BATCH_DELAY_MS,
  SYNC_MESSAGE_DELAY_MS
} from '@/constants/config'

export { MessageType }
export { SendType }
export type { SyncHistoryMessage, SyncUserMessage, LikeMessage, HateMessage, TextMessage }

export type RoomMessage = LegacyRoomMessage | ProtocolNetworkMessage

export type RoomUser = MessageUser & { peerIds: string[]; joinTime: number }

export interface SendTextMessageInput {
  id?: string
  body: string
  atUsers: AtUser[]
  senderType?: 'user' | 'ai'
  aiMeta?: AiMessageMeta
  username?: string
  userAvatar?: string
}

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

    const HLCState = domain.state({
      name: 'Room.HLCState',
      default: createHLC()
    })

    const UpdateHLCCommand = domain.command({
      name: 'Room.UpdateHLCCommand',
      impl: (_, hlc: { timestamp: number; counter: number }) => HLCState().new(hlc)
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
          console.error(
            'SelfUser not found in user list. PeerId:',
            chatRoomExtern.peerId,
            'UserList:',
            get(UserListQuery())
          )
          return null
        }
        return user
      }
    })

    const PrivateChatTargetState = domain.state<RoomUser | null>({
      name: 'Room.PrivateChatTargetState',
      default: null
    })

    const PrivateChatTargetQuery = domain.query({
      name: 'Room.PrivateChatTargetQuery',
      impl: ({ get }) => {
        return get(PrivateChatTargetState())
      }
    })

    const SelectPrivateChatTargetCommand = domain.command({
      name: 'Room.SelectPrivateChatTargetCommand',
      impl: (_, target: RoomUser | null) => {
        return PrivateChatTargetState().new(target)
      }
    })

    const LastMessageTimeQuery = domain.query({
      name: 'Room.LastMessageTimeQuery',
      impl: ({ get }) => {
        return (
          get(messageListDomain.query.ListQuery())
            .filter((message) => message.type === MessageType.Normal && !message.isPrivate)
            .toSorted((a, b) => b.sendTime - a.sendTime)[0]?.sendTime ?? new Date(1970, 1, 1).getTime()
        )
      }
    })

    const JoinIsFinishedQuery = JoinStatusModule.query.IsFinishedQuery

    const CompatibilityModeQuery = domain.query({
      name: 'Room.CompatibilityModeQuery',
      impl: ({ get }) => get(userInfoDomain.query.UserInfoQuery())?.compatibilityMode ?? 'legacy'
    })

    const IsUpstreamModeQuery = domain.query({
      name: 'Room.IsUpstreamModeQuery',
      impl: ({ get }) => get(CompatibilityModeQuery()) === 'upstream'
    })

    const PeerListQuery = domain.query({
      name: 'Room.PeerListQuery',
      impl: ({ get }) =>
        get(UserListQuery())
          .flatMap((user) => user.peerIds)
          .filter((peerId) => peerId !== get(PeerIdQuery()))
    })

    const LastMessageHLCQuery = domain.query({
      name: 'Room.LastMessageHLCQuery',
      impl: ({ get }) => {
        const messages = get(messageListDomain.query.ListQuery()).filter((message) => message.type === MessageType.Normal)
        if (!messages.length) return createHLC()
        return messages
          .filter((message): message is NormalMessage => message.type === MessageType.Normal)
          .map((message) => message.hlc ?? createPseudoHLC(message.sendTime))
          .reduce((latest, current) => (compareHLC(current, latest) > 0 ? current : latest), createHLC())
      }
    })

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
      impl: ({ get }, message: string | SendTextMessageInput) => {
        const self = get(SelfUserQuery())

        // 檢查用戶是否已經加入房間
        if (!self) {
          console.error('Cannot send message: User not joined to room yet')
          return [OnErrorEvent(new Error('Please wait for connection to be established.'))]
        }

        const privateTarget = get(PrivateChatTargetQuery())
        const isPrivate = !!privateTarget
        const upstreamMode = get(IsUpstreamModeQuery())

        const input =
          typeof message === 'string'
            ? {
                body: message,
                atUsers: [] as AtUser[],
                senderType: 'user' as const
              }
            : {
                senderType: 'user' as const,
                ...message
              }

        const sendTime = Date.now()
        const upstreamHLC = upstreamMode ? sendHLCEvent(get(HLCState())) : undefined
        const effectiveSender: MessageUser = {
          userId: self.userId,
          username: input.username ?? self.username,
          userAvatar: input.userAvatar ?? self.userAvatar
        }

        const textMessage: TextMessage = {
          ...self,
          ...effectiveSender,
          id: input.id ?? nanoid(),
          type: SendType.Text,
          sendTime,
          body: input.body,
          atUsers: input.atUsers,
          senderType: input.senderType,
          aiMeta: input.aiMeta,
          isPrivate,
          toUser: privateTarget
            ? {
                userId: privateTarget.userId,
                username: privateTarget.username,
                userAvatar: privateTarget.userAvatar
              }
            : undefined
        }

        const protocolMessage = upstreamMode
          ? createProtocolTextMessage({
              id: textMessage.id,
              sender: effectiveSender,
              body: input.body,
              mentions: input.atUsers,
              sentAt: sendTime,
              hlc: upstreamHLC ?? createPseudoHLC(sendTime),
              senderType: input.senderType,
              aiMeta: input.aiMeta,
              isPrivate,
              toUser: privateTarget
                ? {
                    userId: privateTarget.userId,
                    username: privateTarget.username,
                    userAvatar: privateTarget.userAvatar
                  }
                : undefined
            })
          : null

        const listMessage: NormalMessage = {
          ...textMessage,
          type: MessageType.Normal,
          receiveTime: sendTime,
          hlc: upstreamHLC,
          likeUsers: [],
          hateUsers: [],
          atUsers: input.atUsers,
          senderType: input.senderType,
          aiMeta: input.aiMeta,
          isPrivate,
          toUser: privateTarget
            ? {
                userId: privateTarget.userId,
                username: privateTarget.username,
                userAvatar: privateTarget.userAvatar
              }
            : undefined
        }

        // 檢查實際送出的 payload 大小是否超過 WebRTC 限制
        const outgoingPayload = protocolMessage ?? textMessage
        const messageSize = getTextByteSize(JSON.stringify(outgoingPayload))
        if (messageSize >= WEB_RTC_MAX_MESSAGE_SIZE) {
          console.error('Message too large to send:', messageSize, 'bytes')
          return [OnErrorEvent(new Error('Message size cannot exceed 256KiB.'))]
        }

        try {
          if (privateTarget) {
            const freshTarget = get(UserListQuery()).find((u) => u.userId === privateTarget.userId)
            if (freshTarget) {
              chatRoomExtern.sendMessage(protocolMessage ?? textMessage, freshTarget.peerIds)
            } else {
              return [OnErrorEvent(new Error('Target user is no longer online.'))]
            }
          } else if (protocolMessage) {
            const peerIds = get(PeerListQuery())
            peerIds.length && chatRoomExtern.sendMessage(protocolMessage, peerIds)
          } else {
            chatRoomExtern.sendMessage(textMessage)
          }
          return [
            upstreamHLC ? UpdateHLCCommand(upstreamHLC) : null,
            messageListDomain.command.CreateItemCommand(listMessage),
            SendTextMessageEvent(textMessage)
          ].filter(Boolean)
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

        if (get(IsUpstreamModeQuery()) && !localMessage.isPrivate) {
          const newHLC = sendHLCEvent(get(HLCState()))
          const protocolMessage = createProtocolReactionMessage({
            id: nanoid(),
            sender: self,
            sentAt: Date.now(),
            hlc: newHLC,
            targetId: messageId,
            reaction: 'like'
          })
          const peerIds = get(PeerListQuery())
          peerIds.length && chatRoomExtern.sendMessage(protocolMessage, peerIds)
          return [UpdateHLCCommand(newHLC), messageListDomain.command.UpdateItemCommand(listMessage), SendLikeMessageEvent(likeMessage)]
        }

        if (localMessage.isPrivate && localMessage.toUser) {
          const otherUserId =
            self.userId === localMessage.toUser.userId ? localMessage.userId : localMessage.toUser.userId
          const otherUser = get(UserListQuery()).find((u) => u.userId === otherUserId)
          if (otherUser) {
            chatRoomExtern.sendMessage(likeMessage, otherUser.peerIds)
          }
        } else {
          chatRoomExtern.sendMessage(likeMessage)
        }

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

        if (get(IsUpstreamModeQuery()) && !localMessage.isPrivate) {
          const newHLC = sendHLCEvent(get(HLCState()))
          const protocolMessage = createProtocolReactionMessage({
            id: nanoid(),
            sender: self,
            sentAt: Date.now(),
            hlc: newHLC,
            targetId: messageId,
            reaction: 'hate'
          })
          const peerIds = get(PeerListQuery())
          peerIds.length && chatRoomExtern.sendMessage(protocolMessage, peerIds)
          return [UpdateHLCCommand(newHLC), messageListDomain.command.UpdateItemCommand(listMessage), SendHateMessageEvent(hateMessage)]
        }

        if (localMessage.isPrivate && localMessage.toUser) {
          const otherUserId =
            self.userId === localMessage.toUser.userId ? localMessage.userId : localMessage.toUser.userId
          const otherUser = get(UserListQuery()).find((u) => u.userId === otherUserId)
          if (otherUser) {
            chatRoomExtern.sendMessage(hateMessage, otherUser.peerIds)
          }
        } else {
          chatRoomExtern.sendMessage(hateMessage)
        }

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

        const now = Date.now()

        if (get(IsUpstreamModeQuery())) {
          const newHLC = sendHLCEvent(get(HLCState()))
          const protocolMessage = createProtocolPeerSyncMessage({
            id: nanoid(),
            sender: self,
            sentAt: now,
            peerId: chatRoomExtern.peerId,
            joinedAt: self.joinTime,
            lastMessageHLC: get(LastMessageHLCQuery()),
            hlc: newHLC
          })

          chatRoomExtern.sendMessage(protocolMessage, peerId)
          return [
            UpdateHLCCommand(newHLC),
            SendSyncUserMessageEvent({
              ...self,
              id: protocolMessage.id,
              peerId,
              sendTime: now,
              lastMessageTime: protocolMessage.lastMessageHLC.timestamp,
              type: SendType.SyncUser
            })
          ]
        }

        const lastMessageTime = get(LastMessageTimeQuery())
        const syncUserMessage: SyncUserMessage = {
          ...self,
          id: nanoid(),
          peerId: chatRoomExtern.peerId,
          sendTime: now,
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
      impl: (
        { get },
        payload:
          | { peerId: string; lastMessageTime: number; lastMessageHLC?: never }
          | { peerId: string; lastMessageTime?: never; lastMessageHLC: { timestamp: number; counter: number } }
      ) => {
        const self = get(SelfUserQuery())
        if (!self) {
          console.error('Cannot send history sync: User not joined to room yet')
          return []
        }

        if (get(IsUpstreamModeQuery()) && payload.lastMessageHLC) {
          const historyMessages = get(messageListDomain.query.ListQuery()).filter(
            (message) =>
              message.type === MessageType.Normal &&
              !message.isPrivate &&
              message.sendTime > payload.lastMessageHLC.timestamp &&
              Date.now() - message.sendTime <= SYNC_HISTORY_MAX_DAYS * 24 * 60 * 60 * 1000
          ) as NormalMessage[]

          return historyMessages
            .toSorted(compareMessageHLC)
            .map((message) => {
            const newHLC = sendHLCEvent(get(HLCState()))
            const protocolMessage = createProtocolHistorySyncMessage({
              id: nanoid(),
              sender: self,
              sentAt: Date.now(),
              messages: [message],
              hlc: newHLC
            })
            chatRoomExtern.sendMessage(protocolMessage, payload.peerId)
            return [
              UpdateHLCCommand(newHLC),
              SendSyncHistoryMessageEvent({
                ...self,
                id: protocolMessage.id,
                sendTime: protocolMessage.sentAt,
                type: SendType.SyncHistory,
                messages: [message]
              })
            ]
          })
            .flat()
        }

        const peerId = payload.peerId
        const lastMessageTime = payload.lastMessageTime ?? 0

        const historyMessages = get(messageListDomain.query.ListQuery()).filter(
          (message) =>
            message.type === MessageType.Normal &&
            !message.isPrivate &&
            message.sendTime > lastMessageTime &&
            Date.now() - message.sendTime <= SYNC_HISTORY_MAX_DAYS * 24 * 60 * 60 * 1000
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
        const onMessage$ = fromEventPattern<unknown>(chatRoomExtern.onMessage).pipe(
          mergeMap((message) => {
            const parsedMessage = isLegacyRoomMessage(message)
              ? message
              : isProtocolNetworkMessage(message)
                ? message
                : null

            if (!parsedMessage) {
              console.warn('Invalid message format', message)
              return EMPTY
            }

            const messageEvent$ = of(OnMessageEvent(parsedMessage))

            const textMessageEvent$ = of(
              parsedMessage.type === SendType.Text
                ? OnTextMessageEvent(parsedMessage)
                : parsedMessage.type === 'text'
                  ? OnTextMessageEvent(toLegacyTextMessage(parsedMessage))
                  : null
            )

            const messageCommand$ = (() => {
              switch (parsedMessage.type) {
                case SendType.SyncUser: {
                  const selfUser = get(SelfUserQuery())

                  // If a new user joins after the current user has entered the room, a join log message needs to be created.
                  const existUser = get(UserListQuery()).find((user) => user.userId === parsedMessage.userId)
                  const isNewJoinUser = !existUser && selfUser && parsedMessage.joinTime > selfUser.joinTime

                  const lastMessageTime = get(LastMessageTimeQuery())
                  const needSyncHistory = lastMessageTime > parsedMessage.lastMessageTime

                  return of(
                    UpdateUserListCommand({ type: 'create', user: parsedMessage }),
                    // 移除 "joined the chat" 訊息
                    null,
                    needSyncHistory && selfUser
                      ? SendSyncHistoryMessageCommand({
                          peerId: parsedMessage.peerId,
                          lastMessageTime: parsedMessage.lastMessageTime
                        })
                      : null
                  )
                }

                case 'peer-sync': {
                  const selfUser = get(SelfUserQuery())
                  const existUser = get(UserListQuery()).find((user) => user.userId === parsedMessage.sender.id)
                  const isNewJoinUser = !existUser && selfUser && parsedMessage.joinedAt > selfUser.joinTime
                  const needSyncHistory = get(LastMessageTimeQuery()) > parsedMessage.lastMessageHLC.timestamp

                  return of(
                    UpdateHLCCommand(receiveHLCEvent(get(HLCState()), parsedMessage.hlc)),
                    UpdateUserListCommand({
                      type: 'create',
                      user: {
                        peerId: parsedMessage.peerId,
                        joinTime: parsedMessage.joinedAt,
                        ...(() => {
                          const sender = parsedMessage.sender
                          return { userId: sender.id, username: sender.name, userAvatar: sender.avatar }
                        })()
                      }
                    }),
                    isNewJoinUser ? null : null,
                    needSyncHistory && selfUser
                      ? SendSyncHistoryMessageCommand({
                          peerId: parsedMessage.peerId,
                          lastMessageHLC: parsedMessage.lastMessageHLC
                        })
                      : null
                  )
                }

                case SendType.SyncHistory: {
                  return of(
                    ...parsedMessage.messages.map((message) =>
                      messageListDomain.command.UpsertItemCommand({
                        ...message,
                        type: MessageType.Normal
                      })
                    )
                  )
                }

                case 'history-sync': {
                  const maxMessageHLC = maxHLC(parsedMessage.messages.map((message) => message.hlc))
                  return of(
                    UpdateHLCCommand(receiveHLCEvent(get(HLCState()), maxMessageHLC)),
                    ...parsedMessage.messages.map((message) =>
                      messageListDomain.command.UpsertItemCommand(denormalizeProtocolTextMessage(message))
                    )
                  )
                }

                case SendType.Text:
                  return of(
                    messageListDomain.command.CreateItemCommand({
                      ...parsedMessage,
                      type: MessageType.Normal,
                      receiveTime: Date.now(),
                      likeUsers: [],
                      hateUsers: []
                    })
                  )
                case 'text':
                  return of(
                    UpdateHLCCommand(receiveHLCEvent(get(HLCState()), parsedMessage.hlc)),
                    messageListDomain.command.CreateItemCommand(denormalizeProtocolTextMessage(parsedMessage))
                  )
                case SendType.Like:
                case SendType.Hate: {
                  if (!get(messageListDomain.query.HasItemQuery(parsedMessage.id))) {
                    return EMPTY
                  }
                  const _message = get(messageListDomain.query.ItemQuery(parsedMessage.id)) as NormalMessage
                  const type = parsedMessage.type === 'Like' ? 'likeUsers' : 'hateUsers'
                  return of(
                    messageListDomain.command.UpdateItemCommand({
                      ..._message,
                      receiveTime: Date.now(),
                      [type]: desert(
                        _message[type],
                        {
                          userId: parsedMessage.userId,
                          username: parsedMessage.username,
                          userAvatar: parsedMessage.userAvatar
                        },
                        'userId'
                      )
                    })
                  )
                }
                case 'reaction': {
                  if (!get(messageListDomain.query.HasItemQuery(parsedMessage.targetId))) {
                    return EMPTY
                  }
                  const targetMessage = get(messageListDomain.query.ItemQuery(parsedMessage.targetId)) as NormalMessage
                  const updatedMessage: NormalMessage = {
                    ...targetMessage,
                    receiveTime: Date.now(),
                    likeUsers:
                      parsedMessage.reaction === 'like'
                        ? desert(targetMessage.likeUsers, fromProtocolSender(parsedMessage.sender), 'userId')
                        : targetMessage.likeUsers,
                    hateUsers:
                      parsedMessage.reaction === 'hate'
                        ? desert(targetMessage.hateUsers, fromProtocolSender(parsedMessage.sender), 'userId')
                        : targetMessage.hateUsers
                  }
                  return of(
                    UpdateHLCCommand(receiveHLCEvent(get(HLCState()), parsedMessage.hlc)),
                    messageListDomain.command.UpdateItemCommand(updatedMessage)
                  )
                }
                default:
                  console.warn('Unsupported message type', parsedMessage)
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
            const privateTarget = get(PrivateChatTargetQuery())
            const isPrivateTargetLeaving = privateTarget && existUser && privateTarget.userId === existUser.userId
            const willUserRemainOnline = existUser && existUser.peerIds.filter((id) => id !== peerId).length > 0

            if (existUser) {
              return [
                UpdateUserListCommand({ type: 'delete', user: { ...existUser, peerId } }),
                isPrivateTargetLeaving && !willUserRemainOnline ? SelectPrivateChatTargetCommand(null) : null,
                // 移除 "left the chat" 訊息
                null,
                OnLeaveRoomEvent(peerId)
              ].filter(Boolean)
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
        JoinIsFinishedQuery,
        PrivateChatTargetQuery
      },
      command: {
        JoinRoomCommand,
        LeaveRoomCommand,
        SendTextMessageCommand,
        SendLikeMessageCommand,
        SendHateMessageCommand,
        SendSyncUserMessageCommand,
        SendSyncHistoryMessageCommand,
        SelectPrivateChatTargetCommand
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

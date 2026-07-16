import { type FC, useMemo, useState } from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import MessageList from '../../components/MessageList'
import MessageItem from '../../components/MessageItem'
import PromptItem from '../../components/PromptItem'
import UserInfoDomain from '@/domain/UserInfo'
import ChatRoomDomain, { MessageType } from '@/domain/ChatRoom'
import MessageListDomain, { NormalMessage } from '@/domain/MessageList'
import { compareMessageHLC } from '@/protocol'
import ToastDomain from '@/domain/Toast'
import { getUiText } from '@/utils'
import { canRecallMessage } from '@/utils/messageRecall'

const Main: FC<{ enableAi?: boolean }> = ({ enableAi = true }) => {
  const send = useRemeshSend()
  const messageListDomain = useRemeshDomain(MessageListDomain())
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const toastDomain = useRemeshDomain(ToastDomain())
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const text = getUiText(userInfo?.language)
  const _messageList = useRemeshQuery(messageListDomain.query.ListQuery())
  const chatUserList = useRemeshQuery(chatRoomDomain.query.UserListQuery())
  const privateChatTarget = useRemeshQuery(chatRoomDomain.query.PrivateChatTargetQuery())
  const bannedUserIds = userInfo?.bannedUserIds ?? []
  const hideAllAiMessages = userInfo?.hideAllAiMessages === true
  const [forwardedAiMessageIds, setForwardedAiMessageIds] = useState<Set<string>>(() => new Set())

  const messageList = useMemo(() => {
    return _messageList
      .filter((message) => {
        if (message.type !== MessageType.Normal) return true
        if (!enableAi && message.senderType === 'ai') return false
        if (hideAllAiMessages && message.senderType === 'ai') return false
        if (bannedUserIds.includes(message.userId)) return false
        if (message.senderType === 'ai' && message.aiMeta && bannedUserIds.includes(message.aiMeta.ownerUserId)) {
          return false
        }
        if (!message.isPrivate) return true
        if (message.userId === userInfo?.id) return true
        if (message.toUser?.userId === userInfo?.id) return true
        return false
      })
      .map((message) => {
        if (message.type === MessageType.Normal) {
          return {
            ...message,
            like: message.likeUsers.some((likeUser) => likeUser.userId === userInfo?.id),
            hate: message.hateUsers.some((hateUser) => hateUser.userId === userInfo?.id)
          }
        }
        return message
      })
      .toSorted((a, b) =>
        a.type === MessageType.Normal && b.type === MessageType.Normal
          ? compareMessageHLC(a, b)
          : a.sendTime - b.sendTime
      )
  }, [_messageList, userInfo?.id, bannedUserIds, enableAi, hideAllAiMessages])

  const canInteractWithMessage = (message: any) => {
    if (message.type !== MessageType.Normal) return false
    if (!message.isPrivate) return true
    return message.userId === userInfo?.id || message.toUser?.userId === userInfo?.id
  }

  const handleLikeChange = (messageId: string) => {
    send(chatRoomDomain.command.SendLikeMessageCommand(messageId))
  }

  const handleHateChange = (messageId: string) => {
    send(chatRoomDomain.command.SendHateMessageCommand(messageId))
  }

  const handleRecall = (messageId: string) => {
    send(chatRoomDomain.command.SendRecallMessageCommand(messageId))
  }

  const handleAvatarClick = (message: any) => {
    if (message.senderType === 'ai') {
      return
    }
    if (message.userId === userInfo?.id) {
      return
    }
    const targetUser = chatUserList.find((user) => user.userId === message.userId)
    if (!targetUser) {
      send(toastDomain.command.WarningCommand(text.userOffline))
      return
    }
    if (privateChatTarget?.userId === targetUser.userId) {
      send(chatRoomDomain.command.SelectPrivateChatTargetCommand(null))
    } else {
      send(chatRoomDomain.command.SelectPrivateChatTargetCommand(targetUser))
    }
  }

  const handleCopyMessage = async (message: NormalMessage) => {
    try {
      const payload = message.pageContext?.url
        ? `${message.body}\n\n[${message.pageContext.title || 'Page Link'}](${message.pageContext.url})`
        : message.body
      await navigator.clipboard.writeText(payload)
      setCopiedMessageId(message.id)
      send(toastDomain.command.SuccessCommand({ message: text.copyWithUrlSuccess, duration: 1500 }))
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current))
      }, 1500)
    } catch (error) {
      console.error('[WebTalk] Failed to copy message', error)
      send(toastDomain.command.ErrorCommand(text.copyFail))
    }
  }

  const handleForwardAiMessage = (message: NormalMessage) => {
    if (!userInfo || message.senderType !== 'ai' || forwardedAiMessageIds.has(message.id)) return

    send(
      chatRoomDomain.command.SendTextMessageCommand({
        body: `↪ AI 回應\n\n${message.body}`,
        atUsers: [],
        pageContext: message.pageContext
      })
    )
    setForwardedAiMessageIds((current) => new Set(current).add(message.id))
  }

  const handleOpenMessagePage = (message: NormalMessage) => {
    const url = message.pageContext?.url
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getBanTarget = (message: NormalMessage) => {
    if (message.senderType === 'ai' && message.aiMeta) {
      return {
        userId: message.aiMeta.ownerUserId,
        username: message.aiMeta.ownerUsername
      }
    }

    return {
      userId: message.userId,
      username: message.username
    }
  }

  const handleToggleBanUser = (message: NormalMessage) => {
    if (!userInfo) return

    const target = getBanTarget(message)
    if (target.userId === userInfo.id) return

    const isBanned = bannedUserIds.includes(target.userId)
    const nextBannedUserIds = isBanned
      ? bannedUserIds.filter((id) => id !== target.userId)
      : [...new Set([...bannedUserIds, target.userId])]

    send(
      userInfoDomain.command.UpdateUserInfoCommand({
        ...userInfo,
        bannedUserIds: nextBannedUserIds
      })
    )

    send(
      toastDomain.command.SuccessCommand(
        (isBanned ? text.unbanSuccess : text.banSuccess).replace('{username}', target.username)
      )
    )
  }

  return (
    <MessageList>
      {messageList.map((message, index) =>
        message.type === MessageType.Normal ? (
          <MessageItem
            key={message.id}
            data={message}
            like={message.like}
            hate={message.hate}
            onLikeChange={canInteractWithMessage(message) ? () => handleLikeChange(message.id) : undefined}
            onHateChange={canInteractWithMessage(message) ? () => handleHateChange(message.id) : undefined}
            onRecall={
              userInfo && message.senderType !== 'ai' && canRecallMessage(message, userInfo.id, Date.now())
                ? () => handleRecall(message.id)
                : undefined
            }
            onCopy={handleCopyMessage}
            onForwardAi={message.senderType === 'ai' ? handleForwardAiMessage : undefined}
            onOpenPage={handleOpenMessagePage}
            onAvatarClick={handleAvatarClick}
            currentUserId={userInfo?.id}
            copied={copiedMessageId === message.id}
            isAi={message.senderType === 'ai'}
            isForwardedAi={forwardedAiMessageIds.has(message.id)}
            aiOwnerUsername={message.aiMeta?.ownerUsername}
            isBanned={bannedUserIds.includes(getBanTarget(message).userId)}
            locale={userInfo?.language}
            onToggleBanUser={
              getBanTarget(message).userId !== userInfo?.id ? () => handleToggleBanUser(message) : undefined
            }
            className="duration-300 animate-in fade-in-0"
          ></MessageItem>
        ) : (
          <PromptItem
            key={message.id}
            data={message}
            className={`${index === 0 ? 'pt-4' : ''} ${index === messageList.length - 1 ? 'pb-4' : ''}`}
          ></PromptItem>
        )
      )}
    </MessageList>
  )
}

Main.displayName = 'Main'

export default Main

import { type FC, useMemo } from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'

import MessageList from '../../components/MessageList'
import MessageItem from '../../components/MessageItem'
import PromptItem from '../../components/PromptItem'
import UserInfoDomain from '@/domain/UserInfo'
import ChatRoomDomain, { MessageType } from '@/domain/ChatRoom'
import MessageListDomain from '@/domain/MessageList'
import ToastDomain from '@/domain/Toast'

const Main: FC = () => {
  const send = useRemeshSend()
  const messageListDomain = useRemeshDomain(MessageListDomain())
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const toastDomain = useRemeshDomain(ToastDomain())

  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const _messageList = useRemeshQuery(messageListDomain.query.ListQuery())
  const chatUserList = useRemeshQuery(chatRoomDomain.query.UserListQuery())
  const privateChatTarget = useRemeshQuery(chatRoomDomain.query.PrivateChatTargetQuery())

  const messageList = useMemo(() => {
    return _messageList
      .filter((message) => {
        if (message.type !== MessageType.Normal) return true
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
      .toSorted((a, b) => a.sendTime - b.sendTime)
  }, [_messageList, userInfo?.id])

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

  const handleAvatarClick = (message: any) => {
    if (message.userId === userInfo?.id) {
      return
    }
    const targetUser = chatUserList.find((user) => user.userId === message.userId)
    if (!targetUser) {
      send(toastDomain.command.WarningCommand('該用戶已離線，無法進行私聊。'))
      return
    }
    if (privateChatTarget?.userId === targetUser.userId) {
      send(chatRoomDomain.command.SelectPrivateChatTargetCommand(null))
    } else {
      send(chatRoomDomain.command.SelectPrivateChatTargetCommand(targetUser))
    }
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
            onAvatarClick={handleAvatarClick}
            currentUserId={userInfo?.id}
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

import React from 'react'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import MessageListDomain from '@/domain/MessageList'
import MessageInputDomain from '@/domain/MessageInput'
import ChatRoomDomain from '@/domain/ChatRoom'
import AppStatusDomain from '@/domain/AppStatus'

/**
 * 直接聊天視圖組件
 * 這是一個獨立的組件，直接顯示訊息列表和輸入框
 */
const DirectChatView: React.FC = () => {
  const send = useRemeshSend()
  const messageListDomain = useRemeshDomain(MessageListDomain())
  const messageInputDomain = useRemeshDomain(MessageInputDomain())
  const chatRoomDomain = useRemeshDomain(ChatRoomDomain())
  const appStatusDomain = useRemeshDomain(AppStatusDomain())

  // 獲取訊息列表
  const messageList = useRemeshQuery(messageListDomain.query.ListQuery())
  // 獲取輸入訊息
  const message = useRemeshQuery(messageInputDomain.query.MessageQuery())

  // 處理發送訊息
  const handleSend = () => {
    if (!message.trim()) return

    // 確保主視窗打開
    send(appStatusDomain.command.UpdateOpenCommand(true))

    // 發送消息
    send(chatRoomDomain.command.SendTextMessageCommand(message))

    // 清空輸入框
    send(messageInputDomain.command.ClearCommand())
  }

  return (
    <div className="fixed right-0 top-0 z-[9999] flex h-full w-[400px] flex-col border-l-4 border-blue-500 bg-white shadow-2xl">
      {/* 頂部標題 */}
      <div className="bg-blue-500 p-2 text-center font-bold text-white">聊天室 (訊息數量: {messageList.length})</div>

      {/* 訊息列表 */}
      <div className="flex-1 overflow-auto p-4">
        {messageList.length > 0 ? (
          messageList.map((message) => (
            <div key={message.id} className="mb-4 rounded border p-3 shadow-sm">
              <div className="font-bold">{message.username}</div>
              <div className="my-1">{message.body}</div>
              <div className="text-xs text-gray-500">{new Date(message.sendTime).toLocaleTimeString()}</div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">沒有訊息</div>
        )}
      </div>

      {/* 輸入區域 */}
      <div className="border-t p-4">
        <div className="mb-2 text-center text-sm font-bold text-blue-500">訊息輸入區</div>
        <textarea
          className="mb-2 w-full rounded border p-2"
          placeholder="輸入訊息..."
          rows={3}
          value={message}
          onChange={(e) => send(messageInputDomain.command.InputCommand(e.target.value))}
        ></textarea>
        <button className="w-full rounded bg-blue-500 p-2 text-white" onClick={handleSend}>
          發送
        </button>
      </div>
    </div>
  )
}

export default DirectChatView

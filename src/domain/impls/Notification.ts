import { NotificationExtern } from '@/domain/externs/Notification'
import { TextMessage } from '@/domain/ChatRoom'
import { getPlatform } from '@/platform'

class Notification {
  async push(message: TextMessage) {
    return getPlatform().pushNotification(message)
  }
}

export const NotificationImpl = NotificationExtern.impl(new Notification())

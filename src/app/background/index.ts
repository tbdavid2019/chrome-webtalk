import { EVENT } from '@/constants/event'
import { messenger } from '@/messenger'
import { browser, Tabs } from 'wxt/browser'
import { defineBackground } from 'wxt/sandbox'

export default defineBackground({
  type: 'module',
  main() {
    browser.action.onClicked.addListener(async () => {
      // 當用戶點擊擴展圖標時，確保漂浮按鈕可見
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        // 向當前活動標籤頁發送消息，重置按鈕隱藏狀態
        browser.tabs.sendMessage(tabs[0].id, { action: 'resetButtonsHidden' })
      }
      browser.runtime.openOptionsPage()
    })

    const historyNotificationTabs = new Map<string, Tabs.Tab>()
    messenger.onMessage(EVENT.OPTIONS_PAGE_OPEN, () => {
      browser.runtime.openOptionsPage()
    })

    messenger.onMessage(EVENT.NOTIFICATION_PUSH, async ({ data: message, sender }) => {
      // Check if there is an active tab on the same site
      const tabs = await browser.tabs.query({ active: true })
      const hasActiveSomeSiteTab = tabs.some((tab) => {
        return new URL(tab.url!).origin === new URL(sender.tab!.url!).origin
      })

      console.log('sender', sender)

      if (hasActiveSomeSiteTab) return

      browser.notifications.create(message.id, {
        type: 'basic',
        iconUrl: message.userAvatar,
        title: message.username,
        message: message.body,
        contextMessage: sender.tab!.url!
      })
      historyNotificationTabs.set(message.id, sender.tab!)
    })
    messenger.onMessage(EVENT.NOTIFICATION_CLEAR, async ({ data: id }) => {
      browser.notifications.clear(id)
    })

    browser.notifications.onButtonClicked.addListener(async (id) => {
      const fromTab = historyNotificationTabs.get(id)
      if (fromTab?.id) {
        try {
          const tab = await browser.tabs.get(fromTab.id)
          browser.tabs.update(tab.id, { active: true, highlighted: true })
          browser.windows.update(tab.windowId!, { focused: true })
        } catch {
          browser.tabs.create({ url: fromTab.url })
        }
      }
    })

    browser.notifications.onClicked.addListener(async (id) => {
      const fromTab = historyNotificationTabs.get(id)
      if (fromTab?.id) {
        try {
          const tab = await browser.tabs.get(fromTab.id)
          browser.tabs.update(tab.id, { active: true })
        } catch {
          browser.tabs.create({ url: fromTab.url })
        }
      }
    })

    // ✅ 取代舊的 browser.runtime.onMessage.addListener
    // browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //   if (message.action === 'getPageContent') {
    //     if (sender.tab?.id) {
    //       browser.tabs.sendMessage(sender.tab.id, { action: 'getPageContent' }).then(sendResponse)
    //       return true // 必須加這個，否則 response 會無效
    //     }
    //   }
    // })
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (typeof message === 'object' && message !== null && 'action' in message) {
        const typedMessage = message as { action: string }

        if (typedMessage.action === 'getPageContent') {
          if (sender.tab?.id) {
            browser.tabs.sendMessage(sender.tab.id, { action: 'getPageContent' }).then(sendResponse)
            return true // 必須加這個，否則 response 會無效
          }
        }
      }
    })

    browser.notifications.onClosed.addListener(async (id) => {
      historyNotificationTabs.delete(id)
    })
  }
})

import React from 'react'
import { createRoot } from 'react-dom/client'
import { Remesh } from 'remesh'
import { RemeshRoot, RemeshScope } from 'remesh-react'
import { defineContentScript } from 'wxt/sandbox'
import { createShadowRootUi } from 'wxt/client'

import App from './App'
import { LocalStorageImpl, IndexDBStorageImpl, BrowserSyncStorageImpl } from '@/domain/impls/Storage'
import { DanmakuImpl } from '@/domain/impls/Danmaku'
import { NotificationImpl } from '@/domain/impls/Notification'
import { ToastImpl } from '@/domain/impls/Toast'
import { ChatRoomImpl } from '@/domain/impls/ChatRoom'
import { VirtualRoomImpl } from '@/domain/impls/VirtualRoom'

import '@/assets/styles/sonner.css'
import '@/assets/styles/overlay.css'
import '@/assets/styles/tailwind.css'

import NotificationDomain from '@/domain/Notification'
import AppStatusDomain from '@/domain/AppStatus'
import { createElement } from '@/utils'
import { browser } from 'wxt/browser'

// 為 window 添加自定義屬性
declare global {
  interface Window {
    __webtalkMessageHookRegistered?: boolean
  }
}

export default defineContentScript({
  cssInjectionMode: 'ui',
  runAt: 'document_idle',
  matches: ['https://*/*'],
  excludeMatches: ['*://localhost/*', '*://127.0.0.1/*'],
  async main(ctx) {
    // 🌈 初始化 CSS 變數
    window.CSS.registerProperty({
      name: '--shimmer-angle',
      syntax: '<angle>',
      inherits: false,
      initialValue: '0deg'
    })

    // 🧠 初始化 Remesh Store
    const store = Remesh.store({
      externs: [
        LocalStorageImpl,
        IndexDBStorageImpl,
        BrowserSyncStorageImpl,
        ChatRoomImpl,
        VirtualRoomImpl,
        ToastImpl,
        DanmakuImpl,
        NotificationImpl
      ]
    })

    // ✅ 建立 message bridge（處理 getPageContent 請求和重置按鈕隱藏狀態）
    if (!window.__webtalkMessageHookRegistered) {
      browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
        if (message.action === 'getPageContent') {
          console.log('[WebTalk] ✅ 收到 getPageContent 請求')
          sendResponse({ content: document.body.innerText })
          return true
        }

        if (message.action === 'resetButtonsHidden') {
          console.log('[WebTalk] ✅ 收到重置按鈕隱藏狀態請求')
          // 重置按鈕隱藏狀態
          // 由於我們在消息監聽器中，無法直接使用 useRemeshSend
          // 我們可以在下一個渲染週期中通過自定義事件來觸發狀態更新
          const event = new CustomEvent('reset-buttons-hidden')
          window.dispatchEvent(event)
        }
      })
      window.__webtalkMessageHookRegistered = true
    }

    // ⛺ 掛載 Shadow DOM UI
    const ui = await createShadowRootUi(ctx, {
      name: __NAME__,
      position: 'inline',
      anchor: 'body',
      append: 'last',
      mode: 'open',
      isolateEvents: ['keyup', 'keydown', 'keypress'],
      onMount: (container) => {
        const app = createElement('<div id="root"></div>')
        container.append(app)
        const root = createRoot(app)
        root.render(
          <React.StrictMode>
            <RemeshRoot store={store}>
              <RemeshScope domains={[NotificationDomain()]}>
                <App />
              </RemeshScope>
            </RemeshRoot>
          </React.StrictMode>
        )
        return root
      },
      onRemove: (root) => {
        root?.unmount()
      }
    })

    ui.mount()
  }
})

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Remesh } from 'remesh'
import { RemeshRoot, RemeshScope } from 'remesh-react'

import App from '@/app/content/App'
import { LocalStorageImpl, IndexDBStorageImpl, BrowserSyncStorageImpl } from '@/domain/impls/Storage'
import { DanmakuImpl } from '@/domain/impls/Danmaku'
import { NotificationImpl } from '@/domain/impls/Notification'
import { ToastImpl } from '@/domain/impls/Toast'
import { createChatRoomImpl } from '@/domain/impls/ChatRoom'
import { VirtualRoomImpl } from '@/domain/impls/VirtualRoom'
import NotificationDomain from '@/domain/Notification'
import { configurePlatform } from '@/platform'
import { createWebPlatform } from '@/platform/web'
import { setRootNode } from '@/utils'
import type { RoomIdentityOptions } from '@/utils/roomId'
import { readEmbedOptions, type MobilePlacement } from './options'

import tailwindCss from '@/assets/styles/tailwind.css?inline'
import sonnerCss from '@/assets/styles/sonner.css?inline'
import overlayCss from '@/assets/styles/overlay.css?inline'

export interface WebTalkEmbedOptions extends RoomIdentityOptions {
  /** Join the cross-site presence room. Defaults to false for page-scoped embeds. */
  enableVirtualRoom?: boolean
  /** Same-origin or absolute URL of the server-side AI proxy. */
  aiEndpoint?: string
  /** Vercel WebSocket relay endpoint. Defaults to /api/webtalk/ws on the script origin. */
  relayEndpoint?: string
  /** Which half of a mobile viewport the overlay occupies. Defaults to bottom. */
  mobilePlacement?: MobilePlacement
}

export interface WebTalkEmbedCapabilities {
  enableAi: boolean
}

export interface WebTalkController {
  roomId: string
  unmount: () => void
}

declare global {
  interface Window {
    WebTalk?: {
      mount: (options?: WebTalkEmbedOptions) => WebTalkController
      unmount: () => void
    }
  }
}

const HOST_TAG = 'webtalk-widget'

const getCurrentScript = (): HTMLScriptElement | null => {
  return document.currentScript instanceof HTMLScriptElement ? document.currentScript : null
}

const readScriptOptions = (script: HTMLScriptElement | null): WebTalkEmbedOptions => {
  const dataset = script?.dataset
  if (!dataset) return {}

  const scope = dataset.webtalkScope
  return {
    scope: scope === 'meta' || scope === 'origin' || scope === 'path' ? scope : undefined,
    pageId: dataset.webtalkPageId,
    roomId: dataset.webtalkRoomId,
    siteId: dataset.webtalkSiteId,
    metaName: dataset.webtalkMetaName,
    enableVirtualRoom: dataset.webtalkVirtualRoom === 'true',
    aiEndpoint: dataset.webtalkAiEndpoint,
    relayEndpoint:
      dataset.webtalkRelayEndpoint || (script?.src ? new URL('/api/webtalk/ws', script.src).toString() : undefined),
    mobilePlacement: readEmbedOptions(dataset).mobilePlacement
  }
}

const appendStyles = (shadowRoot: ShadowRoot): void => {
  const style = document.createElement('style')
  style.textContent = [tailwindCss, sonnerCss, overlayCss].join('\n')
  shadowRoot.append(style)
}

export const createWebTalkMount = (capabilities: WebTalkEmbedCapabilities) => {
  return (options: WebTalkEmbedOptions = {}): WebTalkController => {
    const existing = document.querySelector(HOST_TAG)
    if (existing) {
      window.WebTalk?.unmount()
    }

    configurePlatform(createWebPlatform({ aiEndpoint: options.aiEndpoint }))

    const chatRoom = createChatRoomImpl(options)
    const roomId = chatRoom.value.roomId
    const store = Remesh.store({
      externs: [
        LocalStorageImpl,
        IndexDBStorageImpl,
        BrowserSyncStorageImpl,
        chatRoom,
        VirtualRoomImpl,
        ToastImpl,
        DanmakuImpl,
        NotificationImpl
      ]
    })

    const host = document.createElement(HOST_TAG)
    host.dataset.webtalkRoomId = roomId
    host.style.setProperty('position', 'fixed', 'important')
    host.style.setProperty('inset', '0', 'important')
    host.style.setProperty('z-index', '2147482000', 'important')
    host.style.setProperty('pointer-events', 'none', 'important')
    const mountTarget = document.body ?? document.documentElement
    mountTarget.append(host)

    const shadowRoot = host.attachShadow({ mode: 'open' })
    appendStyles(shadowRoot)
    const rootElement = document.createElement('div')
    rootElement.id = 'root'
    shadowRoot.append(rootElement)
    setRootNode(shadowRoot)

    const root: Root = createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <RemeshRoot store={store}>
          <RemeshScope domains={[NotificationDomain()]}>
            <App
              enableVirtualRoom={options.enableVirtualRoom === true}
              enableAi={capabilities.enableAi}
              isEmbed
              mobilePlacement={options.mobilePlacement}
            />
          </RemeshScope>
        </RemeshRoot>
      </React.StrictMode>
    )

    const controller: WebTalkController = {
      roomId,
      unmount: () => {
        root.unmount()
        setRootNode(null)
        host.remove()
        window.WebTalk = undefined
      }
    }

    window.WebTalk = {
      mount: createWebTalkMount(capabilities),
      unmount: controller.unmount
    }

    return controller
  }
}

export const bootstrapWebTalkEmbed = (capabilities: WebTalkEmbedCapabilities): void => {
  const mount = createWebTalkMount(capabilities)
  window.WebTalk = {
    mount,
    unmount: () => undefined
  }

  const script = getCurrentScript()
  if (script?.dataset.webtalkAutoMount !== 'false') {
    try {
      mount(readScriptOptions(script))
    } catch (error) {
      console.error('[WebTalk] Embed was not mounted.', error)
    }
  }
}

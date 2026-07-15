import { browser } from 'wxt/browser'
import { EVENT } from '@/constants/event'
import { messenger } from '@/messenger'
import {
  FALLBACK_GROQ_API_KEY,
  FALLBACK_GROQ_BASE_URL,
  FALLBACK_GROQ_MODEL,
  FALLBACK_GROQ_VISION_MODEL
} from '@/constants/apiDefaults'
import type { PlatformAdapter, PlatformNotificationMessage, PlatformStorage, PlatformStorageArea } from './index'

const storage: PlatformStorage = {
  async get<T>(area: PlatformStorageArea, key: string) {
    const result = await browser.storage[area].get(key)
    return (result[key] as T | undefined) ?? null
  },
  async getAll(area) {
    return browser.storage[area].get()
  },
  async set(area, key, value) {
    await browser.storage[area].set({ [key]: value })
  },
  async remove(area, key) {
    await browser.storage[area].remove(key)
  },
  async clear(area) {
    await browser.storage[area].clear()
  },
  watch(area, callback) {
    const listener = (changes: Record<string, { newValue?: unknown }>) => {
      Object.keys(changes).forEach(callback)
    }
    browser.storage[area].onChanged.addListener(listener)
    return () => browser.storage[area].onChanged.removeListener(listener)
  }
}

export const createExtensionPlatform = (): PlatformAdapter => ({
  storage,
  ai: {
    mode: 'direct',
    endpoint: FALLBACK_GROQ_BASE_URL,
    apiKey: FALLBACK_GROQ_API_KEY,
    model: FALLBACK_GROQ_MODEL,
    visionModel: FALLBACK_GROQ_VISION_MODEL
  },
  getPageContent: () => document.body?.innerText ?? '',
  openSettings: () => {
    void messenger.sendMessage(EVENT.OPTIONS_PAGE_OPEN, undefined)
  },
  openHistory: () => {
    window.open(browser.runtime.getURL('/history.html'), '_blank', 'noopener,noreferrer')
  },
  async pushNotification(message: PlatformNotificationMessage) {
    await messenger.sendMessage(EVENT.NOTIFICATION_PUSH, message as any)
    return message.id
  }
})

import type { PlatformAdapter, PlatformNotificationMessage, PlatformStorage, PlatformStorageArea } from './index'

const STORAGE_EVENT = 'webtalk-storage-change'
const STORAGE_PREFIX = 'WEB_TALK_WEB:'

const storageKey = (area: PlatformStorageArea, key: string): string => `${STORAGE_PREFIX}${area}:${key}`

const read = (area: PlatformStorageArea, key: string): unknown | null => {
  const value = window.localStorage.getItem(storageKey(area, key))
  if (value == null) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const notifyStorageChange = (area: PlatformStorageArea, key: string): void => {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { area, key } }))
}

const storage: PlatformStorage = {
  async get<T>(area: PlatformStorageArea, key: string) {
    return read(area, key) as T | null
  },
  async getAll(area) {
    const prefix = `${STORAGE_PREFIX}${area}:`
    const result: Record<string, unknown> = {}

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      result[key.slice(prefix.length)] = read(area, key.slice(prefix.length))
    }

    return result
  },
  async set(area, key, value) {
    window.localStorage.setItem(storageKey(area, key), JSON.stringify(value))
    notifyStorageChange(area, key)
  },
  async remove(area, key) {
    window.localStorage.removeItem(storageKey(area, key))
    notifyStorageChange(area, key)
  },
  async clear(area) {
    const prefix = `${STORAGE_PREFIX}${area}:`
    const keys: string[] = []

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) keys.push(key)
    }

    keys.forEach((key) => window.localStorage.removeItem(key))
    notifyStorageChange(area, '')
  },
  watch(area, callback) {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || !event.key?.startsWith(`${STORAGE_PREFIX}${area}:`)) return
      callback(event.key.slice(`${STORAGE_PREFIX}${area}:`.length))
    }
    const onCustomStorage = (event: Event) => {
      const detail = (event as CustomEvent<{ area?: PlatformStorageArea; key?: string }>).detail
      if (detail?.area === area) callback(detail.key ?? '')
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(STORAGE_EVENT, onCustomStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(STORAGE_EVENT, onCustomStorage)
    }
  }
}

export const createWebPlatform = (options: { aiEndpoint?: string } = {}): PlatformAdapter => ({
  storage,
  ai: {
    mode: 'proxy',
    endpoint: options.aiEndpoint || '/api/webtalk/ai',
    model: 'default',
    visionModel: 'default'
  },
  getPageContent: () => document.body?.innerText ?? '',
  openSettings: () => window.dispatchEvent(new CustomEvent('webtalk-open-settings')),
  openHistory: () => window.dispatchEvent(new CustomEvent('webtalk-open-history')),
  async pushNotification(message: PlatformNotificationMessage) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(message.username, { body: message.body, icon: message.userAvatar })
    }
    return message.id
  }
})

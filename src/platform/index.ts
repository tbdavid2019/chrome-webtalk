import { createWebPlatform } from './web'

export type PlatformStorageArea = 'local' | 'sync'

export interface PlatformStorage {
  get: <T = unknown>(area: PlatformStorageArea, key: string) => Promise<T | null>
  getAll: (area: PlatformStorageArea) => Promise<Record<string, unknown>>
  set: (area: PlatformStorageArea, key: string, value: unknown) => Promise<void>
  remove: (area: PlatformStorageArea, key: string) => Promise<void>
  clear: (area: PlatformStorageArea) => Promise<void>
  watch: (area: PlatformStorageArea, callback: (key: string) => void) => () => void
}

export interface PlatformNotificationMessage {
  id: string
  username: string
  userAvatar: string
  body: string
}

export interface PlatformAiConfig {
  mode: 'direct' | 'proxy'
  endpoint: string
  apiKey?: string
  model: string
  visionModel: string
}

export interface PlatformAdapter {
  storage: PlatformStorage
  ai: PlatformAiConfig
  getPageContent: () => string
  openSettings: () => void
  openHistory: () => void
  pushNotification: (message: PlatformNotificationMessage) => Promise<string>
}

let activePlatform: PlatformAdapter = createWebPlatform()

export const configurePlatform = (platform: PlatformAdapter): void => {
  activePlatform = platform
}

export const getPlatform = (): PlatformAdapter => activePlatform

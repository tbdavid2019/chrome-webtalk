import { createStorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'
import localStorageDriver from 'unstorage/drivers/localstorage'
import {
  LocalStorageExtern,
  IndexDBStorageExtern,
  BrowserSyncStorageExtern,
  BrowserLocalStorageExtern,
  UserInfoStorageExtern
} from '@/domain/externs/Storage'
import { STORAGE_NAME, USER_INFO_AVATAR_STORAGE_KEY, USER_INFO_STORAGE_KEY } from '@/constants/config'
import { platformStorageDriver } from '@/platform/storageDriver'

import { Storage, type StorageValue } from '@/domain/externs/Storage'
import { EVENT } from '@/constants/event'
import type { UserInfo } from '@/domain/UserInfo'
import { mergeUserInfoStorage, splitUserInfoStorage, type UserInfoLocalStorage } from '@/domain/userInfoStorage'

/**
 * Waiting to be resolved
 * @see https://github.com/unjs/unstorage/issues/277
 * */

export const localStorage = createStorage({
  driver: localStorageDriver({ base: `${STORAGE_NAME}:` })
})

export const indexDBStorage = createStorage({
  driver: indexedDbDriver({ base: `${STORAGE_NAME}:` })
})

export const browserSyncStorage = createStorage({
  driver: platformStorageDriver({ storageArea: 'sync' })
})

export const browserLocalStorage = createStorage({
  driver: platformStorageDriver({ storageArea: 'local' })
})

export const LocalStorageImpl = LocalStorageExtern.impl({
  name: STORAGE_NAME,
  get: localStorage.getItem,
  set: localStorage.setItem,
  remove: localStorage.removeItem,
  clear: localStorage.clear,
  watch: async (callback) => {
    const unwatch = await localStorage.watch(callback)

    /**
     * Because the storage event cannot be triggered in the same browsing context
     * it is necessary to listen for click events from DanmukuMessage.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event
     */
    addEventListener(EVENT.APP_OPEN, callback)
    return async () => {
      removeEventListener(EVENT.APP_OPEN, callback)
      return unwatch()
    }
  },
  unwatch: localStorage.unwatch
})

export const IndexDBStorageImpl = IndexDBStorageExtern.impl({
  name: STORAGE_NAME,
  get: indexDBStorage.getItem,
  set: indexDBStorage.setItem,
  remove: indexDBStorage.removeItem,
  clear: indexDBStorage.clear,
  watch: indexDBStorage.watch as Storage['watch'],
  unwatch: indexDBStorage.unwatch
})

export const BrowserSyncStorageImpl = BrowserSyncStorageExtern.impl({
  name: STORAGE_NAME,
  get: browserSyncStorage.getItem,
  set: browserSyncStorage.setItem,
  remove: browserSyncStorage.removeItem,
  clear: browserSyncStorage.clear,
  watch: browserSyncStorage.watch as Storage['watch'],
  unwatch: browserSyncStorage.unwatch
})

export const BrowserLocalStorageImpl = BrowserLocalStorageExtern.impl({
  name: STORAGE_NAME,
  get: browserLocalStorage.getItem,
  set: browserLocalStorage.setItem,
  remove: browserLocalStorage.removeItem,
  clear: browserLocalStorage.clear,
  watch: browserLocalStorage.watch as Storage['watch'],
  unwatch: browserLocalStorage.unwatch
})

export const UserInfoStorageImpl = UserInfoStorageExtern.impl({
  name: STORAGE_NAME,
  get: async <T extends StorageValue>(key: string) => {
    const [syncValue, localValue] = await Promise.all([
      BrowserSyncStorageImpl.value.get<UserInfo>(key),
      BrowserLocalStorageImpl.value.get<UserInfoLocalStorage>(USER_INFO_AVATAR_STORAGE_KEY)
    ])
    return mergeUserInfoStorage(syncValue, localValue) as T | null
  },
  set: async (key, value) => {
    if (value === null) {
      await UserInfoStorageImpl.value.remove(key)
      return
    }

    const { sync, local } = splitUserInfoStorage(value as UserInfo)
    await Promise.all([
      BrowserSyncStorageImpl.value.set(key, sync),
      BrowserLocalStorageImpl.value.set(USER_INFO_AVATAR_STORAGE_KEY, local)
    ])
  },
  remove: async (key) => {
    await Promise.all([
      BrowserSyncStorageImpl.value.remove(key),
      BrowserLocalStorageImpl.value.remove(USER_INFO_AVATAR_STORAGE_KEY)
    ])
  },
  clear: async () => {
    await Promise.all([
      BrowserSyncStorageImpl.value.remove(USER_INFO_STORAGE_KEY),
      BrowserLocalStorageImpl.value.remove(USER_INFO_AVATAR_STORAGE_KEY)
    ])
  },
  watch: async (callback) => {
    const [unwatchSync, unwatchLocal] = await Promise.all([
      BrowserSyncStorageImpl.value.watch(callback),
      BrowserLocalStorageImpl.value.watch(callback)
    ])

    return async () => {
      await Promise.all([unwatchSync(), unwatchLocal()])
    }
  },
  unwatch: async () => undefined
})

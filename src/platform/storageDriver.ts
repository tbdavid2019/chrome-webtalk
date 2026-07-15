import { defineDriver, type Driver, type WatchCallback } from 'unstorage'
import { getPlatform, type PlatformStorageArea } from './index'

export interface PlatformStorageDriverOptions {
  storageArea: PlatformStorageArea
}

export const platformStorageDriver: (options: PlatformStorageDriverOptions) => Driver = defineDriver(
  (options: PlatformStorageDriverOptions) => ({
    name: `platform:${options.storageArea}`,
    async hasItem(key) {
      return (await getPlatform().storage.get(options.storageArea, key)) != null
    },
    async getItem(key) {
      return (await getPlatform().storage.get(options.storageArea, key)) as string | null
    },
    async getItems(items) {
      return Promise.all(
        items.map(async (item) => ({
          key: item.key,
          value: (await getPlatform().storage.get(options.storageArea, item.key)) as string | null
        }))
      )
    },
    async setItem(key, value) {
      await getPlatform().storage.set(options.storageArea, key, value)
    },
    async setItems(items) {
      await Promise.all(items.map((item) => getPlatform().storage.set(options.storageArea, item.key, item.value)))
    },
    async removeItem(key) {
      await getPlatform().storage.remove(options.storageArea, key)
    },
    async getKeys() {
      return Object.keys(await getPlatform().storage.getAll(options.storageArea))
    },
    async clear() {
      await getPlatform().storage.clear(options.storageArea)
    },
    watch(callback: WatchCallback) {
      return getPlatform().storage.watch(options.storageArea, (key) => callback('update', key))
    }
  })
)

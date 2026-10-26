import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlatformStorage } from '../platform/index.ts'
import {
  loadApiProviderSettingsFromStorage,
  loadApiSettingsFromStorage,
  saveApiSettingsToStorage
} from './apiSettingsStorageCore.ts'

const createStorage = (syncEntries: Record<string, unknown> = {}) => {
  const areas: Record<'local' | 'sync', Map<string, unknown>> = {
    local: new Map(),
    sync: new Map(Object.entries(syncEntries))
  }
  const storage: PlatformStorage = {
    async get<T>(area: 'local' | 'sync', key: string) {
      return (areas[area].get(key) as T | undefined) ?? null
    },
    async getAll(area) {
      return Object.fromEntries(areas[area])
    },
    async set(area, key, value) {
      areas[area].set(key, value)
    },
    async remove(area, key) {
      areas[area].delete(key)
    },
    async clear(area) {
      areas[area].clear()
    },
    watch() {
      return () => undefined
    }
  }
  return { storage, areas }
}

test('migrates legacy Groq values from sync into local storage', async () => {
  const { storage, areas } = createStorage({
    groqApiKey: 'user-groq-key',
    groqApiBaseURL: 'https://api.groq.com/openai/v1',
    groqModelName: 'my-groq-model'
  })

  const settings = await loadApiSettingsFromStorage(storage)

  assert.equal(settings.provider, 'groq')
  assert.equal(settings.apiKey, 'user-groq-key')
  assert.equal(settings.apiModelName, 'my-groq-model')
  assert.equal(areas.sync.has('groqApiKey'), false)
  assert.deepEqual(areas.local.get('webtalkApiSettings'), settings)
})

test('keeps each provider profile when another provider is saved', async () => {
  const { storage } = createStorage()
  await saveApiSettingsToStorage(storage, {
    provider: 'groq',
    apiKey: 'my-own-groq-key',
    apiBaseURL: 'https://api.groq.com/openai/v1',
    apiModelName: 'custom-groq-model',
    apiVisionModelName: 'custom-groq-vision'
  })
  await saveApiSettingsToStorage(storage, {
    provider: 'gemini',
    apiKey: 'my-gemini-key',
    apiBaseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiModelName: 'gemini-custom',
    apiVisionModelName: 'gemini-vision'
  })

  const groq = await loadApiProviderSettingsFromStorage(storage, 'groq')
  const gemini = await loadApiProviderSettingsFromStorage(storage, 'gemini')

  assert.equal(groq.apiKey, 'my-own-groq-key')
  assert.equal(groq.apiModelName, 'custom-groq-model')
  assert.equal(gemini.apiKey, 'my-gemini-key')
  assert.equal(gemini.apiModelName, 'gemini-custom')
})

test('rejects an unsupported provider saved in local settings', async () => {
  const { storage, areas } = createStorage()
  areas.local.set('webtalkApiSettings', { provider: 'unknown-provider' })

  await assert.rejects(loadApiSettingsFromStorage(storage), /Unsupported AI provider/)
})

import {
  FALLBACK_GROQ_API_KEY,
  FALLBACK_GROQ_BASE_URL,
  FALLBACK_GROQ_MODEL,
  FALLBACK_GROQ_VISION_MODEL
} from '../constants/apiDefaults.ts'
import { getApiProvider, isApiProvider, type ApiProvider } from './apiProviders.ts'
import type { PlatformStorage } from '../platform/index.ts'

const STORAGE_KEY = 'webtalkApiSettings'
const LEGACY_KEYS = ['groqApiKey', 'groqApiBaseURL', 'groqModelName', 'groqVisionModelName'] as const

export interface ApiProviderProfile {
  apiKey: string
  apiBaseURL: string
  apiModelName: string
  apiVisionModelName: string
}

export interface ApiSettings extends ApiProviderProfile {
  provider: ApiProvider
  providerProfiles?: Partial<Record<ApiProvider, ApiProviderProfile>>
}

const defaultsFor = (provider: ApiProvider): ApiSettings => {
  const isGroq = provider === 'groq'
  return {
    provider,
    apiKey: isGroq ? FALLBACK_GROQ_API_KEY : '',
    apiBaseURL: isGroq ? FALLBACK_GROQ_BASE_URL : getApiProvider(provider).baseURL,
    apiModelName: isGroq ? FALLBACK_GROQ_MODEL : '',
    apiVisionModelName: isGroq ? FALLBACK_GROQ_VISION_MODEL : ''
  }
}

const profileOf = (settings: ApiSettings): ApiProviderProfile => ({
  apiKey: settings.apiKey,
  apiBaseURL: settings.apiBaseURL,
  apiModelName: settings.apiModelName,
  apiVisionModelName: settings.apiVisionModelName
})

const normalizeProfile = (provider: ApiProvider, value: unknown): ApiProviderProfile => {
  const defaults = defaultsFor(provider)
  if (!value || typeof value !== 'object') return profileOf(defaults)
  const candidate = value as Partial<ApiProviderProfile>
  return {
    apiKey: typeof candidate.apiKey === 'string' ? candidate.apiKey : defaults.apiKey,
    apiBaseURL: typeof candidate.apiBaseURL === 'string' ? candidate.apiBaseURL : defaults.apiBaseURL,
    apiModelName: typeof candidate.apiModelName === 'string' ? candidate.apiModelName : defaults.apiModelName,
    apiVisionModelName:
      typeof candidate.apiVisionModelName === 'string' ? candidate.apiVisionModelName : defaults.apiVisionModelName
  }
}

const normalizeSettings = (value: Record<string, unknown>): ApiSettings => {
  const provider = value.provider == null ? 'groq' : value.provider
  if (!isApiProvider(provider)) throw new Error(`Unsupported AI provider in saved settings: ${String(provider)}`)

  const settings = { ...defaultsFor(provider), ...normalizeProfile(provider, value) }
  const rawProfiles = value.providerProfiles
  const providerProfiles: Partial<Record<ApiProvider, ApiProviderProfile>> = {}
  if (rawProfiles && typeof rawProfiles === 'object') {
    for (const option of ['groq', 'gemini', 'xai', 'openai', 'deepseek', 'openrouter', 'custom'] as const) {
      if (option in rawProfiles) providerProfiles[option] = normalizeProfile(option, (rawProfiles as Record<string, unknown>)[option])
    }
  }
  providerProfiles[provider] ??= profileOf(settings)
  return { ...settings, provider, providerProfiles }
}

const migrateLegacySyncSettings = async (storage: PlatformStorage): Promise<ApiSettings> => {
  const legacy = await storage.getAll('sync')
  const hasLegacy = LEGACY_KEYS.some((key) => legacy[key] !== undefined)
  if (!hasLegacy) return defaultsFor('groq')

  const migrated = normalizeSettings({
    provider: 'groq',
    apiKey: typeof legacy.groqApiKey === 'string' ? legacy.groqApiKey : FALLBACK_GROQ_API_KEY,
    apiBaseURL: typeof legacy.groqApiBaseURL === 'string' ? legacy.groqApiBaseURL : FALLBACK_GROQ_BASE_URL,
    apiModelName: typeof legacy.groqModelName === 'string' ? legacy.groqModelName : FALLBACK_GROQ_MODEL,
    apiVisionModelName:
      typeof legacy.groqVisionModelName === 'string' ? legacy.groqVisionModelName : FALLBACK_GROQ_VISION_MODEL
  })
  await storage.set('local', STORAGE_KEY, migrated)
  await Promise.all(LEGACY_KEYS.map((key) => storage.remove('sync', key).catch(() => undefined)))
  return migrated
}

export const loadApiSettingsFromStorage = async (storage: PlatformStorage): Promise<ApiSettings> => {
  const saved = await storage.get<Record<string, unknown>>('local', STORAGE_KEY)
  if (!saved || typeof saved !== 'object') return migrateLegacySyncSettings(storage)

  const normalized = normalizeSettings(saved)
  if (!saved.providerProfiles || saved.provider == null) {
    await storage.set('local', STORAGE_KEY, normalized)
  }
  return normalized
}

export const loadApiProviderSettingsFromStorage = async (
  storage: PlatformStorage,
  provider: ApiProvider
): Promise<ApiSettings> => {
  const settings = await loadApiSettingsFromStorage(storage)
  if (settings.provider === provider) return settings
  return {
    ...defaultsFor(provider),
    ...settings.providerProfiles?.[provider],
    provider,
    providerProfiles: settings.providerProfiles
  }
}

export const saveApiSettingsToStorage = async (storage: PlatformStorage, settings: ApiSettings): Promise<void> => {
  const current = await loadApiSettingsFromStorage(storage)
  const providerProfiles = {
    ...current.providerProfiles,
    [current.provider]: profileOf(current),
    [settings.provider]: profileOf(settings)
  }
  await storage.set('local', STORAGE_KEY, { ...settings, providerProfiles })
  await Promise.all(LEGACY_KEYS.map((key) => storage.remove('sync', key).catch(() => undefined)))
}

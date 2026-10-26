import { getPlatform } from '../platform/index.ts'
import type { ApiProvider } from './apiProviders'
import {
  loadApiProviderSettingsFromStorage,
  loadApiSettingsFromStorage,
  saveApiSettingsToStorage,
  type ApiSettings
} from './apiSettingsStorageCore.ts'

export type { ApiProviderProfile, ApiSettings } from './apiSettingsStorageCore'

export const loadApiSettings = (): Promise<ApiSettings> => loadApiSettingsFromStorage(getPlatform().storage)

export const loadApiProviderSettings = (provider: ApiProvider): Promise<ApiSettings> =>
  loadApiProviderSettingsFromStorage(getPlatform().storage, provider)

export const saveApiSettings = (settings: ApiSettings): Promise<void> =>
  saveApiSettingsToStorage(getPlatform().storage, settings)

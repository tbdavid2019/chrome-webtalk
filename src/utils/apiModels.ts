import type { ApiSettings } from './apiSettingsStorage'

export interface ApiModelOption {
  id: string
  name?: string
}

export const parseApiModels = (payload: unknown): ApiModelOption[] => {
  if (!payload || typeof payload !== 'object') return []
  const json = payload as { data?: unknown; models?: unknown }
  const rawModels = Array.isArray(json.data) ? json.data : Array.isArray(json.models) ? json.models : []
  return rawModels
    .filter((model: unknown): model is { id: string; name?: string } => {
      return Boolean(model && typeof model === 'object' && 'id' in model && typeof model.id === 'string')
    })
    .map((model: { id: string; name?: string }) => ({ id: model.id, name: model.name }))
    .sort((left, right) => left.id.localeCompare(right.id))
}

export const fetchApiModels = async (settings: ApiSettings): Promise<ApiModelOption[]> => {
  const apiKey = settings.apiKey.trim()
  const baseURL = settings.apiBaseURL.trim().replace(/\/+$/, '')
  if (!apiKey) throw new Error('請先輸入 API Key。')
  if (!baseURL) throw new Error('請先輸入 API Base URL。')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const endpoint = /\/models$/i.test(baseURL) ? baseURL : `${baseURL}/models`
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    })
    const responseText = await response.text()
    let json: unknown
    try {
      json = responseText ? JSON.parse(responseText) : null
    } catch {
      json = null
    }
    if (!response.ok) {
      const errorMessage =
        json && typeof json === 'object' && 'error' in json
          ? (json as { error?: { message?: string } }).error?.message
          : undefined
      throw new Error(errorMessage || `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`)
    }

    const models = parseApiModels(json)
    if (models.length === 0) throw new Error('API 沒有回傳可用模型，請檢查服務端點或自訂模型 ID。')
    return models
  } finally {
    clearTimeout(timeout)
  }
}

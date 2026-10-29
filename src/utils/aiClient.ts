import { getPlatform } from '../platform/index.ts'
import { loadApiSettings, type ApiSettings } from './apiSettingsStorage.ts'
import type { AiToolDefinition } from './webmcp.ts'
import { DEFAULT_AI_PROXY_ENDPOINT } from '../constants/apiDefaults.ts'

export interface AiApiConfig {
  apiKey: string
  baseURL: string
  model: string
  visionModel: string
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content:
    | string
    | null
    | Array<
        | {
            type: 'text'
            text: string
          }
        | {
            type: 'image_url'
            image_url: {
              url: string
            }
          }
      >
  tool_call_id?: string
  tool_calls?: AiToolCall[]
}

export interface AiToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AiCompletionResult {
  content: string
  model: string
  toolCalls: AiToolCall[]
}

export const loadAiApiConfig = async (): Promise<AiApiConfig> => {
  const platformAi = getPlatform().ai
  if (platformAi.mode === 'proxy') {
    return {
      apiKey: '',
      baseURL: platformAi.endpoint,
      model: platformAi.model,
      visionModel: platformAi.visionModel
    }
  }

  const settings = await loadApiSettings()

  return {
    apiKey: String(settings.apiKey || '').trim(),
    baseURL: String(settings.apiBaseURL || platformAi.endpoint).trim(),
    model: String(settings.apiModelName || platformAi.model).trim(),
    visionModel: String(settings.apiVisionModelName || platformAi.visionModel).trim()
  }
}

export const requestAiCompletion = async (input: {
  messages: AiChatMessage[]
  apiKey?: string
  baseURL?: string
  model?: string
  visionModel?: string
  route?: 'text' | 'vision'
  tools?: AiToolDefinition[]
  maxTokens?: number
  signal?: AbortSignal
}): Promise<AiCompletionResult> => {
  const stored = await loadAiApiConfig()
  const rawApiKey = (input.apiKey ?? stored.apiKey).trim()
  const isPlatformProxy = getPlatform().ai.mode === 'proxy'
  const isStarterProxy = !isPlatformProxy && !rawApiKey
  const isProxy = isPlatformProxy || isStarterProxy
  const apiKey = isProxy ? '' : rawApiKey
  const defaultBaseURL = isStarterProxy ? DEFAULT_AI_PROXY_ENDPOINT : stored.baseURL
  const rawBaseURL = (input.baseURL || defaultBaseURL).trim()
  const baseURL = rawBaseURL.replace(/\/+$/, '').replace(/\/models$/i, '').replace(/\/+$/, '')
  const preferredTextModel = (input.model || stored.model).trim()
  const preferredVisionModel = (input.visionModel || stored.visionModel).trim()
  const model = input.route === 'vision' ? preferredVisionModel : preferredTextModel

  const response = await fetch(isProxy ? baseURL : `${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      ...(isProxy ? {} : { Authorization: `Bearer ${apiKey}` }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      ...(input.maxTokens ? { max_tokens: input.maxTokens } : {}),
      ...(input.tools?.length ? { tools: input.tools, tool_choice: 'auto' } : {}),
      ...(isProxy && input.route ? { route: input.route } : {})
    }),
    signal: input.signal
  })

  const responseText = await response.text()
  let json: any
  try {
    json = responseText ? JSON.parse(responseText) : null
  } catch {
    const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
    throw new Error(response.ok ? `Invalid JSON response (${status})` : status)
  }

  if (!response.ok) {
    const errorMessage = json?.error?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  const message = json?.choices?.[0]?.message
  const rawContent = message?.content || json?.content
  const content = typeof rawContent === 'string' ? rawContent.trim() : ''
  const toolCalls = Array.isArray(message?.tool_calls) ? (message.tool_calls as AiToolCall[]) : []
  if (!content && toolCalls.length === 0) {
    const apiError = json?.error?.message || 'Unknown API Error'
    throw new Error(apiError)
  }

  return { content, model: json?.model || model, toolCalls }
}

export const testAiConnection = async (settings: ApiSettings): Promise<void> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const result = await requestAiCompletion({
      apiKey: settings.apiKey,
      baseURL: settings.apiBaseURL,
      model: settings.apiModelName,
      visionModel: settings.apiVisionModelName,
      messages: [{ role: 'user', content: 'Reply with OK only.' }],
      maxTokens: 8,
      signal: controller.signal
    })
    if (!result.content) throw new Error('API 回應沒有文字內容')
  } finally {
    clearTimeout(timeout)
  }
}

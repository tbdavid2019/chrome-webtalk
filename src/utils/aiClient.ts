import { getPlatform } from '@/platform'

export interface AiApiConfig {
  apiKey: string
  baseURL: string
  model: string
  visionModel: string
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content:
    | string
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
}

export interface AiCompletionResult {
  content: string
  model: string
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

  const [groqApiKey, groqApiBaseURL, groqModelName, groqVisionModelName] = await Promise.all([
    getPlatform().storage.get<string>('sync', 'groqApiKey'),
    getPlatform().storage.get<string>('sync', 'groqApiBaseURL'),
    getPlatform().storage.get<string>('sync', 'groqModelName'),
    getPlatform().storage.get<string>('sync', 'groqVisionModelName')
  ])

  return {
    apiKey: String(groqApiKey || platformAi.apiKey || '').trim(),
    baseURL: String(groqApiBaseURL || platformAi.endpoint).trim(),
    model: String(groqModelName || platformAi.model).trim(),
    visionModel: String(groqVisionModelName || platformAi.visionModel).trim()
  }
}

export const requestAiCompletion = async (input: {
  messages: AiChatMessage[]
  apiKey?: string
  baseURL?: string
  model?: string
  visionModel?: string
  route?: 'text' | 'vision'
}): Promise<AiCompletionResult> => {
  const stored = await loadAiApiConfig()
  const isProxy = getPlatform().ai.mode === 'proxy'
  const apiKey = (input.apiKey || stored.apiKey).trim()
  const baseURL = (input.baseURL || stored.baseURL).trim()
  const preferredTextModel = (input.model || stored.model).trim()
  const preferredVisionModel = (input.visionModel || stored.visionModel).trim()
  const model = input.route === 'vision' ? preferredVisionModel : preferredTextModel

  if (!isProxy && !apiKey) {
    throw new Error('API key is required')
  }

  const response = await fetch(isProxy ? baseURL : `${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      ...(isProxy ? {} : { Authorization: `Bearer ${apiKey}` }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      ...(isProxy && input.route ? { route: input.route } : {})
    })
  })

  const json = await response.json()

  if (!response.ok) {
    const errorMessage = json?.error?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  const content = (json?.choices?.[0]?.message?.content || json?.content)?.trim()
  if (!content) {
    const apiError = json?.error?.message || 'Unknown API Error'
    throw new Error(apiError)
  }

  return { content, model: json?.model || model }
}

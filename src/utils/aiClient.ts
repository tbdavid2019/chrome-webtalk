import { browser } from 'wxt/browser'
import {
  FALLBACK_GROQ_API_KEY,
  FALLBACK_GROQ_BASE_URL,
  FALLBACK_GROQ_MODEL,
  FALLBACK_GROQ_VISION_MODEL
} from '@/constants/apiDefaults'

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
  const { groqApiKey, groqApiBaseURL, groqModelName, groqVisionModelName } = await browser.storage.sync.get([
    'groqApiKey',
    'groqApiBaseURL',
    'groqModelName',
    'groqVisionModelName'
  ])

  return {
    apiKey: String(groqApiKey || import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_GROQ_API_KEY).trim(),
    baseURL: String(groqApiBaseURL || import.meta.env.VITE_GEMINI_API_BASE_URL || FALLBACK_GROQ_BASE_URL).trim(),
    model: String(groqModelName || import.meta.env.VITE_GEMINI_MODEL_NAME || FALLBACK_GROQ_MODEL).trim(),
    visionModel: String(groqVisionModelName || FALLBACK_GROQ_VISION_MODEL).trim()
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
  const apiKey = (input.apiKey || stored.apiKey).trim()
  const baseURL = (input.baseURL || stored.baseURL).trim()
  const preferredTextModel = (input.model || stored.model).trim() || FALLBACK_GROQ_MODEL
  const preferredVisionModel = (input.visionModel || stored.visionModel).trim() || FALLBACK_GROQ_VISION_MODEL
  const model = input.route === 'vision' ? preferredVisionModel : preferredTextModel

  if (!apiKey) {
    throw new Error('API key is required')
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: input.messages
    })
  })

  const json = await response.json()

  if (!response.ok) {
    const errorMessage = json?.error?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  const content = json?.choices?.[0]?.message?.content?.trim()
  if (!content) {
    const apiError = json?.error?.message || 'Unknown API Error'
    throw new Error(apiError)
  }

  return { content, model }
}

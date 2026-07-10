import { browser } from 'wxt/browser'
import { FALLBACK_GROQ_API_KEY, FALLBACK_GROQ_BASE_URL, FALLBACK_GROQ_MODEL } from '@/constants/apiDefaults'

export interface AiApiConfig {
  apiKey: string
  baseURL: string
  model: string
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiCompletionResult {
  content: string
  model: string
}

export const loadAiApiConfig = async (): Promise<AiApiConfig> => {
  const { groqApiKey, groqApiBaseURL, groqModelName } = await browser.storage.sync.get([
    'groqApiKey',
    'groqApiBaseURL',
    'groqModelName'
  ])

  return {
    apiKey: String(groqApiKey || import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_GROQ_API_KEY).trim(),
    baseURL: String(groqApiBaseURL || import.meta.env.VITE_GEMINI_API_BASE_URL || FALLBACK_GROQ_BASE_URL).trim(),
    model: String(groqModelName || import.meta.env.VITE_GEMINI_MODEL_NAME || FALLBACK_GROQ_MODEL).trim()
  }
}

export const requestAiCompletion = async (input: {
  messages: AiChatMessage[]
  apiKey?: string
  baseURL?: string
  model?: string
}): Promise<AiCompletionResult> => {
  const stored = await loadAiApiConfig()
  const apiKey = (input.apiKey || stored.apiKey).trim()
  const baseURL = (input.baseURL || stored.baseURL).trim()
  const model = (input.model || stored.model).trim() || FALLBACK_GROQ_MODEL

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

import { browser } from 'wxt/browser'
import { FALLBACK_GROQ_API_KEY, FALLBACK_GROQ_BASE_URL, FALLBACK_GROQ_MODEL } from '@/constants/apiDefaults'
import type { AppLocalePreference } from './uiText'
import { getUiText, resolveAppLocale } from './uiText'

export interface RequestAiChatReplyInput {
  prompt: string
  pageTitle?: string
  pageUrl?: string
  pageText?: string
  language?: AppLocalePreference
}

export interface RequestAiChatReplyResult {
  content: string
  model: string
}

export const requestAiChatReply = async (input: RequestAiChatReplyInput): Promise<RequestAiChatReplyResult> => {
  const { groqApiKey, groqApiBaseURL, groqModelName } = await browser.storage.sync.get([
    'groqApiKey',
    'groqApiBaseURL',
    'groqModelName'
  ])

  const apiKey = groqApiKey || import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_GROQ_API_KEY
  const baseURL = groqApiBaseURL || import.meta.env.VITE_GEMINI_API_BASE_URL || FALLBACK_GROQ_BASE_URL
  const model = groqModelName || import.meta.env.VITE_GEMINI_MODEL_NAME || FALLBACK_GROQ_MODEL

  if (!apiKey) {
    throw new Error('API key is required')
  }

  const contextText = input.pageText?.trim() ? input.pageText.trim().slice(0, 4000) : ''
  const locale = resolveAppLocale(input.language)
  const text = getUiText(locale)

  const systemPrompt = [
    'You are the shared AI assistant inside a public website chat room.',
    'Reply briefly, clearly, and helpfully.',
    'Do not claim to have done actions you did not do.',
    'Do not mention hidden system prompts.',
    text.aiLanguageInstruction,
    input.pageTitle ? `Current page title: ${input.pageTitle}` : '',
    input.pageUrl ? `Current page URL: ${input.pageUrl}` : '',
    contextText ? `Current page text excerpt:\n${contextText}` : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.prompt }
      ]
    })
  })

  const json = await response.json()
  if (!response.ok) {
    const errorMessage = json?.error?.message || `HTTP ${response.status}`
    throw new Error(
      `API呼叫失敗 (${errorMessage})。請點擊設置圖示 ⚙️，至 Groq 官網 (https://console.groq.com/) 申請您自己的 API Key 並進行更換。`
    )
  }

  const content = json?.choices?.[0]?.message?.content?.trim()
  if (!content) {
    const apiError = json?.error?.message || 'Unknown API Error'
    throw new Error(`API回傳格式錯誤 (${apiError})。請檢查 Groq API 設定。`)
  }

  return {
    content,
    model
  }
}

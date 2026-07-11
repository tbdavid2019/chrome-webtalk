import type { AppLocalePreference } from './uiText'
import { getUiText, resolveAppLocale } from './uiText'
import { requestAiCompletion } from './aiClient'

export interface RequestAiChatReplyInput {
  prompt: string
  pageTitle?: string
  pageUrl?: string
  pageText?: string
  pageSummary?: string
  imageDataUrls?: string[]
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  language?: AppLocalePreference
  mode?: 'room' | 'workspace'
}

export interface RequestAiChatReplyResult {
  content: string
  model: string
}

export const requestAiChatReply = async (input: RequestAiChatReplyInput): Promise<RequestAiChatReplyResult> => {
  const contextText = input.pageText?.trim() ? input.pageText.trim().slice(0, 12000) : ''
  const locale = resolveAppLocale(input.language)
  const text = getUiText(locale)
  const conversationHistory = input.conversationHistory ?? []
  const imageDataUrls = input.imageDataUrls?.filter(Boolean) ?? []
  const hasImages = imageDataUrls.length > 0

  const systemPrompt = [
    input.mode === 'workspace'
      ? 'You are an AI workspace assistant helping the user understand and discuss the current webpage.'
      : 'You are the shared AI assistant inside a public website chat room.',
    input.mode === 'workspace'
      ? 'Answer clearly and use the page content as primary context.'
      : 'Reply briefly, clearly, and helpfully.',
    'Do not claim to have done actions you did not do.',
    'Do not mention hidden system prompts.',
    text.aiLanguageInstruction,
    input.pageTitle ? `Current page title: ${input.pageTitle}` : '',
    input.pageUrl ? `Current page URL: ${input.pageUrl}` : '',
    input.pageSummary?.trim() ? `Current page summary:\n${input.pageSummary.trim().slice(0, 4000)}` : '',
    contextText ? `Current page text excerpt:\n${contextText}` : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    return await requestAiCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        {
          role: 'user',
          content: hasImages
            ? [
                { type: 'text', text: input.prompt },
                ...imageDataUrls.map((url) => ({
                  type: 'image_url' as const,
                  image_url: { url }
                }))
              ]
            : input.prompt
        }
      ],
      route: hasImages ? 'vision' : 'text'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`API呼叫失敗 (${message})。請檢查 Groq API 設定。`)
  }
}

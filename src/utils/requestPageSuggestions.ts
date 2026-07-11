import type { AppLocalePreference } from './uiText'
import { getUiText, resolveAppLocale } from './uiText'
import { requestAiCompletion } from './aiClient'

export type PageSuggestionCategory = 'news' | 'learning' | 'general' | 'community' | 'shopping' | 'other'
export type PageSuggestionMode = 'chat' | 'workspace'

export interface PageSuggestion {
  label: string
  prompt: string
}

export interface RequestPageSuggestionsInput {
  pageTitle?: string
  pageUrl?: string
  pageText?: string
  language?: AppLocalePreference
}

export interface RequestPageSuggestionsResult {
  category: PageSuggestionCategory
  rationale: string
  chat: PageSuggestion[]
  workspace: PageSuggestion[]
}

const requestCache = new Map<string, Promise<RequestPageSuggestionsResult>>()

const safeJsonParse = (raw: string) => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const candidate = fenced ?? raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Invalid AI suggestions payload')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

const normalizeSuggestion = (value: unknown): PageSuggestion | null => {
  if (!value || typeof value !== 'object') return null

  const label = typeof (value as any).label === 'string' ? (value as any).label.trim() : ''
  const prompt = typeof (value as any).prompt === 'string' ? (value as any).prompt.trim() : ''

  if (!label || !prompt) return null

  return {
    label: label.slice(0, 40),
    prompt: prompt.slice(0, 160)
  }
}

const fallbackSuggestions = (locale: AppLocalePreference | undefined): RequestPageSuggestionsResult => {
  const text = getUiText(locale)

  return {
    category: 'general',
    rationale: 'fallback',
    chat: [
      { label: text.pageSuggestionChatLabel1, prompt: text.pageSuggestionChatPrompt1 },
      { label: text.pageSuggestionChatLabel2, prompt: text.pageSuggestionChatPrompt2 },
      { label: text.pageSuggestionChatLabel3, prompt: text.pageSuggestionChatPrompt3 }
    ],
    workspace: [
      { label: text.pageSuggestionWorkspaceLabel1, prompt: text.pageSuggestionWorkspacePrompt1 },
      { label: text.pageSuggestionWorkspaceLabel2, prompt: text.pageSuggestionWorkspacePrompt2 },
      { label: text.pageSuggestionWorkspaceLabel3, prompt: text.pageSuggestionWorkspacePrompt3 }
    ]
  }
}

export const requestPageSuggestions = async (
  input: RequestPageSuggestionsInput
): Promise<RequestPageSuggestionsResult> => {
  const locale = resolveAppLocale(input.language)
  const text = getUiText(locale)
  const contextText = input.pageText?.trim() ? input.pageText.trim().slice(0, 8000) : ''
  const cacheKey = JSON.stringify({
    locale,
    url: input.pageUrl ?? '',
    title: input.pageTitle ?? '',
    text: contextText.slice(0, 2000)
  })

  const cached = requestCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const task = (async () => {
    try {
      const result = await requestAiCompletion({
        messages: [
          {
            role: 'system',
            content: [
              'You analyze the current webpage and propose discussion prompts.',
              'Classify the page into one of: news, learning, general, community, shopping, other.',
              'Return strict JSON only.',
              'Return this shape:',
              '{"category":"news","rationale":"short","chat":[{"label":"...","prompt":"..."}],"workspace":[{"label":"...","prompt":"..."}]}',
              'Provide exactly 3 chat suggestions and exactly 3 workspace suggestions.',
              'Chat suggestions should be discussion starters suitable for a shared room.',
              'Workspace suggestions should be direct questions the user may ask AI privately.',
              'Keep label under 12 words and prompt under 45 words.',
              text.aiLanguageInstruction
            ].join('\n')
          },
          {
            role: 'user',
            content: [
              input.pageTitle ? `Page title: ${input.pageTitle}` : '',
              input.pageUrl ? `Page URL: ${input.pageUrl}` : '',
              contextText ? `Page text excerpt:\n${contextText}` : '',
              'Please infer the page type and suggest prompts.'
            ]
              .filter(Boolean)
              .join('\n\n')
          }
        ]
      })

      const parsed = safeJsonParse(result.content)
      const category = new Set<PageSuggestionCategory>([
        'news',
        'learning',
        'general',
        'community',
        'shopping',
        'other'
      ]).has(parsed.category)
        ? (parsed.category as PageSuggestionCategory)
        : 'general'

      const chat = Array.isArray(parsed.chat) ? parsed.chat.map(normalizeSuggestion).filter(Boolean) : []
      const workspace = Array.isArray(parsed.workspace)
        ? parsed.workspace.map(normalizeSuggestion).filter(Boolean)
        : []

      if (chat.length < 2 || workspace.length < 2) {
        return fallbackSuggestions(locale)
      }

      return {
        category,
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale.slice(0, 120) : '',
        chat: chat.slice(0, 3) as PageSuggestion[],
        workspace: workspace.slice(0, 3) as PageSuggestion[]
      }
    } catch (error) {
      console.error('[WebTalk] Failed to generate page suggestions', error)
      return fallbackSuggestions(locale)
    }
  })()

  requestCache.set(cacheKey, task)
  return task
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export type SummaryHistoryEntry = {
  id: string
  url: string
  title: string
  summary: string
  chatMessages: ChatMessage[]
  createdAt: number
}

export const HISTORY_STORAGE_KEY = 'aiSummaryHistory'
export const HISTORY_LIMIT = 50

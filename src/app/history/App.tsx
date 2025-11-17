import { useCallback, useEffect, useMemo, useState } from 'react'
import { browser } from 'wxt/browser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, SummaryHistoryEntry, HISTORY_STORAGE_KEY } from '@/types/summaryHistory'

// 確保在擴充套件環境中運行
if (typeof browser === 'undefined' || !browser.storage) {
  console.error('此頁面只能在 Chrome 擴充套件環境中運行')
}

const sortEntries = (entries: SummaryHistoryEntry[]) =>
  [...entries].sort((a, b) => b.createdAt - a.createdAt)

const HistoryApp = () => {
  const [entries, setEntries] = useState<SummaryHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    const stored = await browser.storage.local.get(HISTORY_STORAGE_KEY)
    const list = Array.isArray(stored[HISTORY_STORAGE_KEY]) ? stored[HISTORY_STORAGE_KEY] : []
    setEntries(sortEntries(list as SummaryHistoryEntry[]))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadHistory()
    const listener = (changes: Record<string, any>, areaName: string) => {
      if (areaName === 'local' && HISTORY_STORAGE_KEY in changes) {
        loadHistory()
      }
    }
    browser.storage.onChanged.addListener(listener)
    return () => browser.storage.onChanged.removeListener(listener)
  }, [loadHistory])

  const clearHistory = async () => {
    await browser.storage.local.remove(HISTORY_STORAGE_KEY)
    setEntries([])
  }

  const historyContent = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-slate-500">Loading...</p>
    }
    if (entries.length === 0) {
      return <p className="text-sm text-slate-500">No chat history yet.</p>
    }
    return entries.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
  }, [entries, loading])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">History</p>
            <h1 className="text-3xl font-semibold text-slate-900">AI Chat Records</h1>
            <p className="text-sm text-slate-500">Each entry keeps the page link, summary and follow-up chat.</p>
          </div>
          <button
            onClick={clearHistory}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white disabled:opacity-40"
            disabled={entries.length === 0}
          >
            Clear history
          </button>
        </header>
        <div className="space-y-5">{historyContent}</div>
      </div>
    </div>
  )
}

const HistoryCard = ({ entry }: { entry: SummaryHistoryEntry }) => {
  const formattedDate = new Date(entry.createdAt).toLocaleString()

  const handleOpenPage = () => {
    if (entry.url) {
      window.open(entry.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <article className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={handleOpenPage}
            className="text-left text-lg font-semibold text-slate-900 hover:underline"
            title={entry.url}
          >
            {entry.title || entry.url}
          </button>
          <p className="text-xs text-slate-400">{entry.url}</p>
        </div>
        <span className="text-xs font-medium text-slate-500">{formattedDate}</span>
      </div>
      {entry.summary && (
        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm text-slate-700">
            {entry.summary}
          </ReactMarkdown>
        </div>
      )}
      {entry.chatMessages?.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation</p>
          <div className="space-y-2">
            {entry.chatMessages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm shadow ${
          isUser ? 'bg-indigo-600 text-white' : 'border border-slate-100 bg-slate-50 text-slate-700'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

export default HistoryApp

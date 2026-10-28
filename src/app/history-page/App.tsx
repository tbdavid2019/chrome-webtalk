import { useCallback, useEffect, useMemo, useState } from 'react'
import { browser, type Browser } from 'wxt/browser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage, SummaryHistoryEntry, HISTORY_STORAGE_KEY } from '@/types/summaryHistory'
import { checkDarkMode, cn, subscribeDarkModeChange } from '@/utils'

const sortEntries = (entries: SummaryHistoryEntry[]) =>
  [...entries].sort((a, b) => b.createdAt - a.createdAt)

const HistoryApp = () => {
  const [entries, setEntries] = useState<SummaryHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(() => checkDarkMode())

  useEffect(() => {
    return subscribeDarkModeChange(setIsDark)
  }, [])

  const loadHistory = useCallback(async () => {
    const stored = await browser.storage.local.get(HISTORY_STORAGE_KEY)
    const list = Array.isArray(stored[HISTORY_STORAGE_KEY]) ? stored[HISTORY_STORAGE_KEY] : []
    setEntries(sortEntries(list as SummaryHistoryEntry[]))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadHistory()
    const listener = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
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
      return <p className="text-sm text-muted-foreground">Loading...</p>
    }
    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">No chat history yet.</p>
    }
    return entries.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
  }, [entries, loading])

  return (
    <div className={cn('min-h-screen bg-background text-foreground', isDark && 'dark')}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">History</p>
            <h1 className="text-3xl font-semibold text-foreground">AI Chat Records</h1>
            <p className="text-sm text-muted-foreground">Each entry keeps the page link, summary and follow-up chat.</p>
          </div>
          <button
            onClick={clearHistory}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
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
    <article className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={handleOpenPage}
            className="text-left text-lg font-semibold text-foreground hover:underline"
            title={entry.url}
          >
            {entry.title || entry.url}
          </button>
          <p className="text-xs text-muted-foreground">{entry.url}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{formattedDate}</span>
      </div>
      {entry.summary && (
        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/60 p-3 text-sm text-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm prose-slate dark:prose-invert text-foreground">
            {entry.summary}
          </ReactMarkdown>
        </div>
      )}
      {entry.chatMessages?.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversation</p>
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
        className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm shadow-2xs ${
          isUser ? 'bg-primary text-primary-foreground font-medium' : 'border border-border bg-muted/80 text-foreground'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

export default HistoryApp

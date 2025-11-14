import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSummarize } from '@/hooks/useSummarize'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import { browser } from 'wxt/browser'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { nanoid } from 'nanoid'
import { FALLBACK_GROQ_API_KEY, FALLBACK_GROQ_BASE_URL, FALLBACK_GROQ_MODEL } from '@/constants/apiDefaults'
import { ChatMessage, SummaryHistoryEntry, HISTORY_STORAGE_KEY, HISTORY_LIMIT } from '@/types/summaryHistory'

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_GROQ_API_KEY
const DEFAULT_API_BASE_URL = import.meta.env.VITE_GEMINI_API_BASE_URL || FALLBACK_GROQ_BASE_URL
const DEFAULT_MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL_NAME || FALLBACK_GROQ_MODEL

type SummaryPanelProps = {
  onClose: () => void
}

type Lang = 'zh_TW' | 'zh_CN' | 'en'


const detectBrowserLang = (): Lang => {
  const lang = navigator.language
  if (lang.startsWith('zh-TW')) return 'zh_TW'
  if (lang.startsWith('zh')) return 'zh_CN'
  if (lang.startsWith('en')) return 'en'
  return 'en'
}

const LANG_MAP: Record<Lang, Record<string, string>> = {
  zh_TW: {
    title: 'AI 工具',
    panelSubtitle: '智慧摘要與對談',
    summarySectionTitle: '摘要',
    summarySectionHint: '幫你抓重點',
    chatSectionTitle: '問 AI',
    chatSectionHint: '延伸追問',
    summarize: '開始摘要',
    speaking: '朗讀',
    copy: '複製',
    image: '匯出圖片',
    markdown: '匯出 .md',
    retry: '重新摘要',
    loading: '摘要中...',
    noContent: '請先點上方按鈕開始摘要...',
    copied: '✅ 已複製到剪貼簿',
    copyFail: '❌ 複製失敗',
    exportFail: '❌ 匯出區塊未找到',
    pageFail: '❗ 無法取得頁面內容',
    noText: '⚠️ 沒有取得頁面文字，無法進行摘要',
    close: '✕',
    chatTitle: '續問 AI',
    chatPlaceholder: '就這個頁面提問...',
    chatSend: '送出',
    chatEmpty: '目前沒有續問紀錄',
    chatNeedSummary: '請先產生摘要後再提問',
    chatThinking: 'AI 思考中...',
    chatError: '⚠️ 無法取得回覆，請稍後再試',
    clear: '清除',
    history: '歷史'
  },
  zh_CN: {
    title: 'AI 工具',
    panelSubtitle: '智能摘要與對談',
    summarySectionTitle: '摘要',
    summarySectionHint: '轻鬆掌握重點',
    chatSectionTitle: '问 AI',
    chatSectionHint: '继续追问',
    summarize: '开始摘要',
    speaking: '朗读',
    copy: '复制',
    image: '导出图片',
    markdown: '导出 .md',
    retry: '重新摘要',
    loading: '摘要中...',
    noContent: '请先点击上方按钮开始摘要...',
    copied: '✅ 已复制到剪贴板',
    copyFail: '❌ 复制失败',
    exportFail: '❌ 导出区域未找到',
    pageFail: '❗ 无法获取页面内容',
    noText: '⚠️ 没有获取页面文字，无法进行摘要',
    close: '✕',
    chatTitle: '继续追问',
    chatPlaceholder: '就这个页面发问...',
    chatSend: '发送',
    chatEmpty: '目前没有追问记录',
    chatNeedSummary: '请先生成摘要后再提问',
    chatThinking: 'AI 思考中...',
    chatError: '⚠️ 暂时无法回应，请稍后再试',
    clear: '清除',
    history: '历史'
  },
  en: {
    title: 'AI Workspace',
    panelSubtitle: 'Summaries & Chat',
    summarySectionTitle: 'Summary',
    summarySectionHint: 'Capture key ideas',
    chatSectionTitle: 'Ask AI',
    chatSectionHint: 'Follow-up questions',
    summarize: 'Summarize',
    speaking: 'Speak',
    copy: 'Copy',
    image: 'Export Image',
    markdown: 'Export .md',
    retry: 'Retry',
    loading: 'Summarizing...',
    noContent: 'Click the button above to generate summary...',
    copied: '✅ Copied to clipboard',
    copyFail: '❌ Copy failed',
    exportFail: '❌ Export target not found',
    pageFail: '❗ Failed to get page content',
    noText: '⚠️ No page content found',
    close: '✕',
    chatTitle: 'Follow-up Chat',
    chatPlaceholder: 'Ask something about this page...',
    chatSend: 'Send',
    chatEmpty: 'No follow-up questions yet',
    chatNeedSummary: 'Generate a summary first before asking',
    chatThinking: 'AI is typing...',
    chatError: '⚠️ Unable to fetch a reply, please try again',
    clear: 'Clear',
    history: 'History'
  }
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ onClose }) => {
  const [language, setLanguage] = useState<Lang>(detectBrowserLang())
  const { summarize, loading, summary, clearSummary } = useSummarize()
  const [pageText, setPageText] = useState('')
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY)
  const [apiBaseURL, setApiBaseURL] = useState(DEFAULT_API_BASE_URL)
  const [apiModelName, setApiModelName] = useState(DEFAULT_MODEL_NAME)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatListRef = useRef<HTMLDivElement | null>(null)
  const chatInputIsComposingRef = useRef(false)
  const pageMetaRef = useRef({
    url: typeof window === 'undefined' ? '' : window.location.href,
    title: typeof document === 'undefined' ? '' : document.title
  })
  const historyEntryRef = useRef<SummaryHistoryEntry | null>(null)
  const text = LANG_MAP[language]
  const hasApiKey = Boolean(apiKey.trim())
  const pageHost = useMemo(() => {
    try {
      return pageMetaRef.current.url ? new URL(pageMetaRef.current.url).hostname : ''
    } catch {
      return pageMetaRef.current.url
    }
  }, [])

  const ensureHistoryEntry = (forceNew = false) => {
    if (!historyEntryRef.current || forceNew) {
      historyEntryRef.current = {
        id: nanoid(),
        url: pageMetaRef.current.url,
        title: pageMetaRef.current.title || pageMetaRef.current.url,
        summary: '',
        chatMessages: [],
        createdAt: Date.now()
      }
    }
    return historyEntryRef.current
  }

  const persistHistoryEntry = async (entry: SummaryHistoryEntry) => {
    try {
      const stored = await browser.storage.local.get(HISTORY_STORAGE_KEY)
      const list: SummaryHistoryEntry[] = Array.isArray(stored[HISTORY_STORAGE_KEY])
        ? stored[HISTORY_STORAGE_KEY]
        : []
      const existIndex = list.findIndex((item) => item.id === entry.id)
      let nextList: SummaryHistoryEntry[]
      if (existIndex === -1) {
        nextList = [entry, ...list]
      } else {
        nextList = list.slice()
        nextList[existIndex] = entry
      }
      if (nextList.length > HISTORY_LIMIT) {
        nextList = nextList.slice(0, HISTORY_LIMIT)
      }
      await browser.storage.local.set({ [HISTORY_STORAGE_KEY]: nextList })
    } catch (error) {
      console.error('[WebTalk] ❌ 保存歷史記錄失敗', error)
    }
  }

  const updateHistoryEntry = (updates: Partial<SummaryHistoryEntry>, options: { forceNew?: boolean } = {}) => {
    const base = ensureHistoryEntry(Boolean(options.forceNew))
    const entry = {
      ...base,
      ...updates,
      summary: updates.summary ?? base.summary,
      chatMessages: updates.chatMessages ?? base.chatMessages
    }
    historyEntryRef.current = entry
    void persistHistoryEntry(entry)
  }

  const handleOpenHistory = () => {
    const historyUrl = browser.runtime.getURL('history.html')
    window.open(historyUrl, '_blank', 'noopener,noreferrer')
  }

  const handleClear = () => {
    clearSummary()
    setChatMessages([])
    setChatInput('')
    historyEntryRef.current = null
  }

  const appendChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => {
      const next = [...prev, message]
      updateHistoryEntry({ chatMessages: next })
      return next
    })
  }

  // 檢查是否已經設置了 API key
  useEffect(() => {
    browser.storage.sync
      .get(['groqApiKey', 'groqApiBaseURL', 'groqModelName'])
      .then((result: { groqApiKey?: string; groqApiBaseURL?: string; groqModelName?: string }) => {
        if (typeof result.groqApiKey === 'string') {
          setApiKey(result.groqApiKey)
        }
        if (typeof result.groqApiBaseURL === 'string') {
          setApiBaseURL(result.groqApiBaseURL)
        }
        if (typeof result.groqModelName === 'string') {
          setApiModelName(result.groqModelName)
        }
      })
      .catch((error) => {
        console.error('[WebTalk] ❌ 獲取 API key 失敗', error)
      })
  }, [])

  // 保存 API 設置
  const saveApiSettings = () => {
    browser.storage.sync
      .set({
        groqApiKey: apiKey,
        groqApiBaseURL: apiBaseURL,
        groqModelName: apiModelName
      })
      .then(() => {
        setShowApiSettings(false)
        alert('✅ API 設置已保存')
      })
      .catch((error) => {
        console.error('[WebTalk] ❌ 保存 API key 失敗', error)
        alert('❌ API 設置保存失敗')
      })
  }

  useEffect(() => {
    // 直接從當前頁面獲取內容
    try {
      const content = document.body.innerText
      console.log('[WebTalk] ✅ 直接獲取頁面內容 (前 100 字)', content.slice(0, 100))
      setPageText(content)
    } catch (error) {
      console.error('[WebTalk] ❌ 直接獲取頁面內容失敗', error)

      // 備用方案：通過 message 獲取
      browser.runtime
        .sendMessage({ action: 'getPageContent' })
        .then((response: any) => {
          console.log('[WebTalk] ✅ 收到頁面內容 (前 100 字)', response?.content?.slice?.(0, 100))
          if (response?.content) {
            setPageText(response.content)
          } else {
            console.warn('[WebTalk] ❌ 沒有收到頁面內容')
            alert(text.pageFail)
          }
        })
        .catch((error) => {
          console.error('[WebTalk] ❌ 發送消息失敗', error)
          alert(text.pageFail)
        })
    }
  }, [text.pageFail])

  useEffect(() => {
    if (!chatListRef.current) return
    chatListRef.current.scrollTo({
      top: chatListRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [chatMessages, chatLoading])

  const onClickSummarize = async () => {
    if (!hasApiKey) {
      setShowApiSettings(true)
      alert('請先設置 API key')
      return
    }

    setChatMessages([])
    setChatInput('')

    if (!pageText) {
      alert(text.noText)
      return
    }

    try {
      const newSummary = await summarize(pageText, language)
      updateHistoryEntry({ summary: newSummary ?? text.noContent, chatMessages: [] }, { forceNew: true })
    } catch (error) {
      console.error('[WebTalk] ❌ 摘要失敗', error)
    }
  }
  const speak = () => {
    if (!summary) return
    const utterance = new SpeechSynthesisUtterance(summary)
    utterance.lang = language === 'zh_TW' ? 'zh-TW' : language === 'zh_CN' ? 'zh-CN' : 'en-US'
    const voices = speechSynthesis.getVoices()
    const match = voices.find((v) => v.lang === utterance.lang)
    if (match) utterance.voice = match
    else utterance.lang = 'en-US'
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      alert(text.copied)
    } catch {
      alert(text.copyFail)
    }
  }

  const exportImage = async () => {
    const el = document.getElementById('summary-content')
    if (!el) return alert(text.exportFail)
    const canvas = await html2canvas(el)
    const link = document.createElement('a')
    link.download = 'summary.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const exportMarkdown = () => {
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' })
    const link = document.createElement('a')
    link.download = 'summary.md'
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  const sendFollowUpQuestion = async () => {
    const question = chatInput.trim()
    if (!question) return

    if (!hasApiKey) {
      setShowApiSettings(true)
      alert('請先設置 API key')
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question
    }

    setChatInput('')
    appendChatMessage(userMessage)
    setChatLoading(true)

    try {
      const { groqApiKey, groqApiBaseURL, groqModelName } = await browser.storage.sync.get([
        'groqApiKey',
        'groqApiBaseURL',
        'groqModelName'
      ])

      const resolvedApiKey = groqApiKey || apiKey || DEFAULT_API_KEY
      const resolvedBaseURL = groqApiBaseURL || apiBaseURL || DEFAULT_API_BASE_URL
      const resolvedModelName = groqModelName || apiModelName || DEFAULT_MODEL_NAME

      if (!resolvedApiKey) {
        alert('請先設置 API key')
        setChatLoading(false)
        return
      }

      const chatHistory = [...chatMessages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content
      }))

      const summaryForPrompt = summary || text.noContent
      const systemPrompt = `你是一個AI助理，請根據提供的原始頁面內容以及（若有的話）摘要來回答使用者的追問，語氣清楚、友善，必要時引用列表或重點。
原始內容：
${pageText.slice(0, 6000)}
----
摘要：
${summaryForPrompt}`

      const response = await fetch(`${resolvedBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resolvedApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: resolvedModelName || 'gemini-2.0-flash',
          messages: [{ role: 'system', content: systemPrompt }, ...chatHistory]
        })
      })

      const data = await response.json()
      const answer = data.choices?.[0]?.message?.content?.trim()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer || text.chatError
      }
      appendChatMessage(assistantMessage)
    } catch (error) {
      console.error('[WebTalk] ❌ 續問失敗', error)
      appendChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: text.chatError
      })
    } finally {
      setChatLoading(false)
    }
  }

  const markedHtml = marked.parse(summary || text.noContent)
  const canChat = !loading

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: '0%' }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed right-0 top-0 z-infinity grid h-full w-[420px] min-w-[360px] max-w-[800px] grid-rows-[auto_1fr] border-l border-slate-100 bg-white font-sans shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{text.title}</p>
            <p className="text-xs text-slate-400">{text.panelSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenHistory}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {text.history}
            </button>
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
              title="API setting 設置"
            >
              ⚙️
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
            >
              {text.close}
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-5">
          {showApiSettings && (
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">API setting</h3>
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm text-slate-500">
                  Gemini API Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="your Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-base-url" className="text-sm text-slate-500">
                  API Base URL
                </Label>
                <Input
                  id="api-base-url"
                  placeholder="API base URL"
                  value={apiBaseURL}
                  onChange={(e) => setApiBaseURL(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">預設default: https://gemini.david888.com/v1</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-model-name" className="text-sm text-slate-500">
                  模型名稱
                </Label>
                <Input
                  id="api-model-name"
                  placeholder="模型名稱"
                  value={apiModelName}
                  onChange={(e) => setApiModelName(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">預設: gemini-2.5-flash</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowApiSettings(false)}
                  className="rounded-full border border-slate-200 px-4 py-1 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={saveApiSettings}
                  className="rounded-full bg-slate-900 px-4 py-1 text-sm font-medium text-white shadow-sm"
                >
                  保存
                </button>
              </div>
            </div>
          )}

          <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text.summarySectionTitle}</p>
                <p className="text-xs text-slate-400">{text.summarySectionHint}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {pageHost && <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{pageHost}</span>}
                <button
                  onClick={handleClear}
                  disabled={!summary?.trim() && chatMessages.length === 0}
                  className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  {text.clear}
                </button>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm font-medium text-slate-700 focus:border-slate-400 focus:ring-slate-400"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Lang)}
              >
                <option value="zh_TW">正體中文</option>
                <option value="zh_CN">简体中文</option>
                <option value="en">English</option>
              </select>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onClickSummarize}
                  disabled={loading}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:bg-slate-400"
                >
                  {!hasApiKey ? '⚠️ Please set API Key first' : loading ? text.loading : text.summarize}
                </button>
                <button
                  onClick={copy}
                  disabled={!summary}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  📋 {text.copy}
                </button>
                <button
                  onClick={exportMarkdown}
                  disabled={!summary}
                  className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-200 disabled:opacity-40"
                >
                  💾 {text.markdown}
                </button>
              </div>

              <div
                id="summary-content"
                className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 text-sm leading-relaxed shadow-inner"
                dangerouslySetInnerHTML={{ __html: markedHtml }}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text.chatSectionTitle}</p>
                <p className="text-xs text-slate-400">{text.chatSectionHint}</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="space-y-4 p-5">
              <div
                ref={chatListRef}
                className="max-h-60 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-sm"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-slate-500">{text.chatEmpty}</p>
                ) : (
                  chatMessages.map((message) => {
                    const isUser = message.role === 'user'
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[90%] rounded-2xl px-4 py-2 text-sm shadow ${
                            isUser ? 'bg-indigo-600 text-white' : 'border border-slate-100 bg-white text-slate-700'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              className="prose prose-sm prose-slate dark:prose-invert prose-a:underline"
                            >
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                {chatLoading && <p className="text-xs text-blue-500">{text.chatThinking}</p>}
              </div>
              <div className="space-y-2">
                <Textarea
                  value={chatInput}
                  placeholder={text.chatPlaceholder}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (chatInputIsComposingRef.current) {
                      return
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendFollowUpQuestion()
                    }
                  }}
                  onCompositionStart={() => {
                    chatInputIsComposingRef.current = true
                  }}
                  onCompositionEnd={() => {
                    chatInputIsComposingRef.current = false
                  }}
                  disabled={chatLoading || !canChat}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm focus-visible:ring-slate-400"
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendFollowUpQuestion}
                    disabled={chatLoading || !chatInput.trim() || !canChat}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:bg-slate-300"
                  >
                    {chatLoading ? text.chatThinking : text.chatSend}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

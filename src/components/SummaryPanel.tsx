import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSummarize } from '@/hooks/useSummarize'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import { getPlatform } from '@/platform'
import type { MobilePlacement } from '@/app/embed/options'
import { resolveEmbedPanelStyle } from '@/app/content/views/AppMain/panelStyle'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { nanoid } from 'nanoid'
import { ChatMessage, SummaryHistoryEntry, HISTORY_STORAGE_KEY, HISTORY_LIMIT } from '@/types/summaryHistory'
import { useRemeshDomain, useRemeshQuery, useRemeshSend } from 'remesh-react'
import AppStatusDomain from '@/domain/AppStatus'
import { SettingsIcon, XIcon, CornerDownLeftIcon, SparklesIcon } from 'lucide-react'
import UserInfoDomain from '@/domain/UserInfo'
import {
  blobToBase64,
  compressImage,
  requestAiChatReply,
  requestPageSuggestions,
  resolveAppLocale,
  type PageSuggestion
} from '@/utils'
import ImageButton from '@/app/content/components/ImageButton'
import PanelModeSwitch from '@/app/content/components/PanelModeSwitch'
import MessageInput from '@/app/content/components/MessageInput'

type SummaryPanelProps = {
  onClose: () => void
  isEmbed?: boolean
  mobilePlacement?: MobilePlacement
}

type Lang = 'zh_TW' | 'zh_CN' | 'en'

type ChatImageAttachment = {
  id: string
  name: string
  dataUrl: string
}

const detectBrowserLang = (): Lang => {
  const lang = navigator.language
  if (lang.startsWith('zh-TW')) return 'zh_TW'
  if (lang.startsWith('zh')) return 'zh_CN'
  if (lang.startsWith('en')) return 'en'
  return 'en'
}

const LANG_MAP: Record<Lang, Record<string, string>> = {
  zh_TW: {
    title: 'AI 空間',
    panelSubtitle: '智慧摘要與對談',
    chatTab: '聊天',
    aiTab: 'AI',
    summarySectionTitle: '摘要',
    summarySectionHint: '幫你抓重點',
    chatSectionTitle: '追問與對話',
    chatSectionHint: '延伸追問',
    summarize: '濃縮',
    speaking: '朗讀',
    copy: '複製',
    image: '匯出圖片',
    markdown: 'markdown',
    retry: '重新摘要',
    loading: '摘要中...',
    noContent: '點擊下方按鈕以濃縮並分析此網頁重點。',
    copied: '✅ 已複製到剪貼簿',
    copyFail: '❌ 複製失敗',
    exportFail: '❌ 匯出區塊未找到',
    pageFail: '❗ 無法取得頁面內容',
    noText: '⚠️ 沒有取得頁面文字，無法進行摘要',
    close: '✕',
    chatTitle: '繼續追問',
    chatPlaceholder: '就這個頁面提問...',
    chatSend: '送出',
    chatEmpty: '目前沒有對話紀錄',
    chatNeedSummary: '請先產生網頁摘要',
    chatThinking: 'AI 思考中...',
    chatError: '⚠️ 無法取得回覆，請稍後再試',
    clear: '清除',
    history: '歷史',
    suggestedQuestions: '推薦問題',
    suggestionsLoading: 'AI 正在觀察這個頁面...',
    suggestionsDescription: '',
    imageAttached: '已附加圖片',
    removeImage: '移除圖片',
    removeAllImages: '移除全部',
    imageReadFailed: '❌ 圖片處理失敗，請稍後再試',
    visionModelHint: '附圖後將改用支援 vision 的模型處理。',
    imagePreviewTitle: '圖片預覽'
  },
  zh_CN: {
    title: 'AI 空间',
    panelSubtitle: '智能摘要與對談',
    chatTab: '聊天',
    aiTab: 'AI',
    summarySectionTitle: '摘要',
    summarySectionHint: '轻鬆掌握重點',
    chatSectionTitle: '追问與对话',
    chatSectionHint: '继续追问',
    summarize: '浓缩',
    speaking: '朗读',
    copy: '复制',
    image: '导出图片',
    markdown: 'markdown',
    retry: '重新摘要',
    loading: '摘要中...',
    noContent: '点击下方按钮以浓缩並分析此网页重点。',
    copied: '✅ 已复制到剪贴板',
    copyFail: '❌ 复制失败',
    exportFail: '❌ 导出区域未找到',
    pageFail: '❗ 无法获取页面内容',
    noText: '⚠️ 没有获取页面文字，无法进行摘要',
    close: '✕',
    chatTitle: '继续追问',
    chatPlaceholder: '就这个页面发问...',
    chatSend: '发送',
    chatEmpty: '目前没有对话记录',
    chatNeedSummary: '请先生成网页摘要',
    chatThinking: 'AI 思考中...',
    chatError: '⚠️ 暂时无法回应，请稍后再试',
    clear: '清除',
    history: '历史',
    suggestedQuestions: '推荐问题',
    suggestionsLoading: 'AI 正在观察这个页面...',
    suggestionsDescription: '',
    imageAttached: '已附加图片',
    removeImage: '移除图片',
    removeAllImages: '移除全部',
    imageReadFailed: '❌ 图片处理失败，请稍后再试',
    visionModelHint: '附图后会改用支持 vision 的模型处理。',
    imagePreviewTitle: '图片预览'
  },
  en: {
    title: 'AI Workspace',
    panelSubtitle: 'Summaries & Chat',
    chatTab: 'Chat',
    aiTab: 'AI',
    summarySectionTitle: 'Summary',
    summarySectionHint: 'Capture key ideas',
    chatSectionTitle: 'Discuss & Ask',
    chatSectionHint: 'Follow-up questions',
    summarize: 'Condense',
    speaking: 'Speak',
    copy: 'Copy',
    image: 'Export Image',
    markdown: 'Markdown',
    retry: 'Retry',
    loading: 'Summarizing...',
    noContent: 'Click the button below to condense this page.',
    copied: '✅ Copied to clipboard',
    copyFail: '❌ Copy failed',
    exportFail: '❌ Export target not found',
    pageFail: '❗ Failed to get page content',
    noText: '⚠️ No page content found',
    close: '✕',
    chatTitle: 'Follow-up Chat',
    chatPlaceholder: 'Ask something about this page...',
    chatSend: 'Send',
    chatEmpty: 'No conversations yet',
    chatNeedSummary: 'Generate a summary first',
    chatThinking: 'AI is typing...',
    chatError: '⚠️ Unable to fetch a reply, please try again',
    clear: 'Clear',
    history: 'History',
    suggestedQuestions: 'Recommended Questions',
    suggestionsLoading: 'AI is scanning this page...',
    suggestionsDescription: '',
    imageAttached: 'Images attached',
    removeImage: 'Remove',
    removeAllImages: 'Remove all',
    imageReadFailed: '❌ Failed to process the image',
    visionModelHint: 'Image questions will use a vision-capable model.',
    imagePreviewTitle: 'Image preview'
  }
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ onClose, isEmbed = false, mobilePlacement = 'bottom' }) => {
  const aiConfig = getPlatform().ai
  const defaultApiKey = aiConfig.apiKey || ''
  const defaultApiBaseURL = aiConfig.endpoint
  const defaultModelName = aiConfig.model
  const send = useRemeshSend()
  const appStatusDomain = useRemeshDomain(AppStatusDomain())
  const userInfoDomain = useRemeshDomain(UserInfoDomain())
  const userInfo = useRemeshQuery(userInfoDomain.query.UserInfoQuery())
  const [language, setLanguage] = useState<Lang>(detectBrowserLang())
  const { summarize, loading, summary, clearSummary, restoreSummary } = useSummarize()
  const [pageText, setPageText] = useState('')
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const [apiBaseURL, setApiBaseURL] = useState(defaultApiBaseURL)
  const [apiModelName, setApiModelName] = useState(defaultModelName)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatImages, setChatImages] = useState<ChatImageAttachment[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<PageSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  const chatListRef = useRef<HTMLDivElement | null>(null)
  const chatInputIsComposingRef = useRef(false)
  const pageMetaRef = useRef({
    url: typeof window === 'undefined' ? '' : window.location.href,
    title: typeof document === 'undefined' ? '' : document.title
  })
  const historyEntryRef = useRef<SummaryHistoryEntry | null>(null)
  const text = LANG_MAP[language]
  const aiProxyEnabled = aiConfig.mode === 'proxy'
  const hasApiKey = aiProxyEnabled || Boolean(apiKey.trim())
  const aiTopicSuggestionsEnabled = userInfo?.aiTopicSuggestionsEnabled !== false
  const embedPanelStyle = isEmbed ? resolveEmbedPanelStyle(isMobile, mobilePlacement) : undefined
  const pageHost = useMemo(() => {
    try {
      return pageMetaRef.current.url ? new URL(pageMetaRef.current.url).hostname : ''
    } catch {
      return pageMetaRef.current.url
    }
  }, [])

  useEffect(() => {
    const locale = resolveAppLocale(userInfo?.language)
    setLanguage(locale)
  }, [userInfo?.language])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
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
      const stored = await getPlatform().storage.get<SummaryHistoryEntry[]>('local', HISTORY_STORAGE_KEY)
      const list: SummaryHistoryEntry[] = Array.isArray(stored) ? stored : []
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
      await getPlatform().storage.set('local', HISTORY_STORAGE_KEY, nextList)
    } catch (error) {
      console.error('[WebTalk] ❌ 保存歷史記錄失敗', error)
    }
  }

  const removeHistoryEntry = async (entryId?: string) => {
    if (!entryId) return

    try {
      const stored = await getPlatform().storage.get<SummaryHistoryEntry[]>('local', HISTORY_STORAGE_KEY)
      const list: SummaryHistoryEntry[] = Array.isArray(stored) ? stored : []

      await getPlatform().storage.set(
        'local',
        HISTORY_STORAGE_KEY,
        list.filter((item) => item.id !== entryId)
      )
    } catch (error) {
      console.error('[WebTalk] ❌ 刪除歷史記錄失敗', error)
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
    getPlatform().openHistory()
  }

  const handleClear = () => {
    void removeHistoryEntry(historyEntryRef.current?.id)
    clearSummary()
    setChatMessages([])
    setChatInput('')
    setChatImages([])
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
    if (aiProxyEnabled) return

    Promise.all([
      getPlatform().storage.get<string>('sync', 'groqApiKey'),
      getPlatform().storage.get<string>('sync', 'groqApiBaseURL'),
      getPlatform().storage.get<string>('sync', 'groqModelName')
    ])
      .then(([groqApiKey, groqApiBaseURL, groqModelName]) => {
        if (typeof groqApiKey === 'string') {
          setApiKey(groqApiKey)
        }
        if (typeof groqApiBaseURL === 'string') {
          setApiBaseURL(groqApiBaseURL)
        }
        if (typeof groqModelName === 'string') {
          setApiModelName(groqModelName)
        }
      })
      .catch((error) => {
        console.error('[WebTalk] ❌ 獲取 API key 失敗', error)
      })
  }, [aiProxyEnabled])

  // 保存 API 設置
  const saveApiSettings = () => {
    const trimmedApiKey = apiKey.trim()
    const trimmedBaseURL = apiBaseURL.trim() || defaultApiBaseURL
    const trimmedModelName = apiModelName.trim() || defaultModelName

    Promise.all([
      getPlatform().storage.set('sync', 'groqApiKey', trimmedApiKey),
      getPlatform().storage.set('sync', 'groqApiBaseURL', trimmedBaseURL),
      getPlatform().storage.set('sync', 'groqModelName', trimmedModelName)
    ])
      .then(() => {
        setApiKey(trimmedApiKey)
        setApiBaseURL(trimmedBaseURL)
        setApiModelName(trimmedModelName)
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
      Promise.resolve(getPlatform().getPageContent())
        .then((content) => {
          console.log('[WebTalk] ✅ 收到頁面內容 (前 100 字)', content.slice(0, 100))
          if (content) {
            setPageText(content)
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
    const restoreCachedEntry = async () => {
      try {
        const stored = await getPlatform().storage.get<SummaryHistoryEntry[]>('local', HISTORY_STORAGE_KEY)
        const list: SummaryHistoryEntry[] = Array.isArray(stored) ? stored : []

        const currentUrl = pageMetaRef.current.url
        if (!currentUrl) return

        const matchedEntry = list
          .filter((entry) => entry.url === currentUrl)
          .sort((a, b) => b.createdAt - a.createdAt)[0]

        if (!matchedEntry) return

        historyEntryRef.current = matchedEntry
        setChatMessages(matchedEntry.chatMessages ?? [])
        if (matchedEntry.summary) {
          restoreSummary(matchedEntry.summary)
        } else {
          clearSummary()
        }
      } catch (error) {
        console.error('[WebTalk] ❌ 讀取 URL 摘要快取失敗', error)
      }
    }

    void restoreCachedEntry()
  }, [clearSummary, restoreSummary])

  useEffect(() => {
    if (!chatListRef.current) return
    chatListRef.current.scrollTo({
      top: chatListRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [chatMessages, chatLoading])

  useEffect(() => {
    let active = true

    if (!aiTopicSuggestionsEnabled || !pageText.trim()) {
      setSuggestedQuestions([])
      setSuggestionsLoading(false)
      return
    }

    setSuggestionsLoading(true)

    requestPageSuggestions({
      pageTitle: pageMetaRef.current.title,
      pageUrl: pageMetaRef.current.url,
      pageText,
      language
    })
      .then((result) => {
        if (!active) return
        setSuggestedQuestions(result.workspace)
      })
      .finally(() => {
        if (!active) return
        setSuggestionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [aiTopicSuggestionsEnabled, language, pageText])

  const onClickSummarize = async () => {
    if (!hasApiKey) {
      setShowApiSettings(true)
      alert('請先設置 API key')
      return
    }

    setChatMessages([])
    setChatInput('')

    let currentText = pageText.trim()
    if (!currentText) {
      try {
        currentText = (getPlatform().getPageContent() || document.body?.innerText || '').trim()
        if (currentText) {
          setPageText(currentText)
        }
      } catch (e) {
        console.error('[WebTalk] 獲取頁面內容失敗', e)
      }
    }

    if (!currentText) {
      alert(text.noText)
      return
    }

    try {
      const newSummary = await summarize(currentText, language, {
        pageTitle: pageMetaRef.current.title,
        pageUrl: pageMetaRef.current.url
      })
      updateHistoryEntry({ summary: newSummary ?? text.noContent, chatMessages: [] })
      setTimeout(() => {
        if (chatListRef.current) {
          chatListRef.current.scrollTop = 0
        }
      }, 50)
    } catch (error: any) {
      console.error('[WebTalk] ❌ 摘要失敗', error)
      alert(error.message || '摘要失敗，請稍後再試 / Condensation failed, please try again')
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

    let currentText = pageText.trim()
    if (!currentText) {
      try {
        currentText = (getPlatform().getPageContent() || document.body?.innerText || '').trim()
        if (currentText) {
          setPageText(currentText)
        }
      } catch (e) {
        console.error('[WebTalk] 獲取頁面內容失敗', e)
      }
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
      const result = await requestAiChatReply({
        prompt: question,
        pageTitle: pageMetaRef.current.title,
        pageUrl: pageMetaRef.current.url,
        pageText: currentText,
        pageSummary: summary,
        conversationHistory: chatMessages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        imageDataUrls: chatImages.map((item) => item.dataUrl),
        language,
        mode: 'workspace'
      })

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.content
      }
      appendChatMessage(assistantMessage)
      setChatImages([])
    } catch (error: any) {
      console.error('[WebTalk] ❌ 續問失敗', error)
      appendChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: error.message || text.chatError
      })
    } finally {
      setChatLoading(false)
    }
  }

  const handleInsertSuggestion = (prompt: string) => {
    setChatInput(prompt)
  }

  const handleSelectChatImage = async (file: File) => {
    try {
      const blob = await compressImage({
        input: file,
        targetSize: 4 * 1024 * 1024,
        outputType: file.size > 4 * 1024 * 1024 ? 'image/webp' : undefined
      })
      const dataUrl = await blobToBase64(blob)
      setChatImages((prev) => [
        ...prev,
        {
          id: nanoid(),
          name: file.name,
          dataUrl
        }
      ])
    } catch (error) {
      console.error('[WebTalk] ❌ AI 空間圖片處理失敗', error)
      alert(text.imageReadFailed)
    }
  }

  const handleSelectChatImages = async (files: File[]) => {
    for (const file of files.slice(0, 4)) {
      await handleSelectChatImage(file)
    }
  }

  const markedHtml = marked.parse(summary || text.noContent)
  const canChat = !loading
  const hasStartedChat = Boolean(summary || chatMessages.length > 0 || chatLoading)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: '0%' }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={embedPanelStyle}
        className={`pointer-events-auto fixed right-0 top-0 z-infinity grid h-full w-[440px] min-w-[380px] max-w-[860px] grid-rows-[auto_1fr] border-l border-border bg-background shadow-2xl ${
          isEmbed && isMobile ? 'min-w-0 max-w-none border-l-0' : ''
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-border bg-background px-4 max-sm:px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SparklesIcon size={16} aria-hidden="true" />
            </span>
            <span className="truncate text-base font-extrabold tracking-wide text-foreground">{text.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 max-sm:gap-1">
            <div className="flex h-8 shrink-0 items-center rounded-[4px] border border-border/80 bg-muted/40 p-0.5">
              {(
                [
                  { code: 'zh_TW', label: '繁' },
                  { code: 'zh_CN', label: '簡' },
                  { code: 'en', label: 'En' }
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`h-full rounded-[3px] px-2.5 text-xs font-semibold transition-all max-sm:px-2 ${
                    language === lang.code
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleOpenHistory}
              className="hidden h-8 shrink-0 items-center justify-center rounded-[4px] border border-border bg-background px-3 text-xs font-semibold leading-none text-foreground transition hover:bg-muted sm:inline-flex"
            >
              {text.history}
            </button>
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-border bg-background text-foreground transition hover:bg-muted"
              title="API setting 設置"
              aria-label="API setting 設置"
            >
              <SettingsIcon size={17} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="關閉 AI 空間"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between space-y-3 bg-background p-4 max-sm:space-y-2 max-sm:p-2">
          {showApiSettings && (
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shrink-0">
              <h3 className="text-base font-semibold text-slate-700">API setting</h3>
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-sm text-slate-500 flex items-center justify-between">
                  <span>
                    Groq API Key <span className="text-red-500">*</span>
                  </span>
                  <a
                    href="https://console.groq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    申請 API Key
                  </a>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="your Groq API Key / 請輸入 Groq API Key"
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
                <p className="text-xs text-gray-500">預設default: {defaultApiBaseURL}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-model-name" className="text-sm text-slate-500">
                  模型名稱 / Model Name
                </Label>
                <Input
                  id="api-model-name"
                  placeholder="模型名稱"
                  value={apiModelName}
                  onChange={(e) => setApiModelName(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">預設: {defaultModelName}</p>
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

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {aiTopicSuggestionsEnabled && (
              <div className="mb-3 rounded-2xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{text.suggestedQuestions}</div>
                  {suggestionsLoading && <div className="text-xs text-muted-foreground">{text.suggestionsLoading}</div>}
                </div>
                {!!text.suggestionsDescription && (
                  <div className="mt-1 text-xs text-muted-foreground">{text.suggestionsDescription}</div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedQuestions.map((item, index) => (
                    <button
                      key={`${item.label}-${index}`}
                      type="button"
                      onClick={() => handleInsertSuggestion(item.prompt)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
                      title={item.prompt}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!hasStartedChat ? (
              /* 1. 未產生摘要且未對話時的引導介面 */
              <div className="flex flex-col flex-1 items-center justify-center p-6 text-center gap-y-4 bg-muted/40 rounded-2xl border border-dashed border-border/80 my-auto">
                <span className="text-3xl">✨</span>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-[300px]">
                  點擊下方按鈕以濃縮並分析此網頁重點。
                </p>
                <button
                  onClick={onClickSummarize}
                  disabled={loading}
                  className="rounded-full bg-primary px-6 py-2.5 text-lg font-bold text-primary-foreground shadow shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50"
                >
                  {loading ? text.loading : '✨ 濃縮此網頁'}
                </button>
              </div>
            ) : (
              /* 2. 已產生摘要或已對話時的對話流介面 (滾動區域) */
              <div
                ref={chatListRef}
                className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-4"
              >
                {/* 網頁摘要氣泡 (置頂呈現) */}
                {!!summary && (
                  <div className="flex flex-col items-start gap-y-1">
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-semibold px-1">
                      <span className="flex items-center gap-1 text-sm">📄 網頁摘要 {pageHost && `(${pageHost})`}</span>
                      {/* 精簡快捷動作組 */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <button
                          onClick={onClickSummarize}
                          disabled={loading}
                          className="hover:text-foreground transition flex items-center gap-0.5 text-xs font-semibold"
                          title={text.retry}
                        >
                          🔄 {loading ? '...' : text.retry}
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={copy}
                          className="hover:text-foreground transition flex items-center gap-0.5 text-xs font-semibold"
                          title={text.copy}
                        >
                          📋 複製
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={exportMarkdown}
                          className="hover:text-foreground transition flex items-center gap-0.5 text-xs font-semibold"
                          title={text.markdown}
                        >
                          📄 MD
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={handleClear}
                          className="hover:text-destructive transition flex items-center gap-0.5 text-xs font-semibold"
                          title={text.clear}
                        >
                          🗑️ {text.clear}
                        </button>
                      </div>
                    </div>
                    <div className="w-full rounded-2xl bg-background border border-border px-4 py-3 text-lg leading-relaxed text-foreground/90 shadow-sm">
                      <div
                        className="prose prose-sm prose-slate dark:prose-invert max-w-none text-base"
                        dangerouslySetInnerHTML={{ __html: markedHtml }}
                      />
                    </div>
                  </div>
                )}

                {/* 續問對話記錄 */}
                {chatMessages.map((message) => {
                  const isUser = message.role === 'user'
                  return (
                    <div key={message.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-y-1`}>
                      <span className="text-xs text-muted-foreground px-1">{isUser ? '👤 你' : '🤖 AI'}</span>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-lg shadow-sm ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'border border-border bg-background text-foreground rounded-tl-sm'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="prose prose-base prose-slate dark:prose-invert prose-a:underline text-lg"
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* AI 思考中 */}
                {chatLoading && (
                  <div className="flex flex-col items-start gap-y-1">
                    <span className="text-xs text-muted-foreground px-1">🤖 AI</span>
                    <div className="rounded-2xl border border-border bg-background rounded-tl-sm px-4 py-2.5 text-lg text-primary font-medium animate-pulse">
                      {text.chatThinking}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部功能與輸入框控制欄 */}
          <div className="flex flex-col gap-2 pt-1 shrink-0">
            <div className="rounded-3xl border border-border bg-muted/20 p-3 shadow-sm">
              <MessageInput
                value={chatInput}
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
                placeholder={text.chatPlaceholder}
                loading={chatLoading}
              />

              {chatImages.length > 0 && (
                <div className="mt-3 rounded-2xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">{text.imageAttached}</span>
                      <span className="ml-2">{chatImages.length}</span>
                      <span className="ml-3 text-xs">{text.visionModelHint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatImages([])}
                      className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
                    >
                      {text.removeAllImages}
                    </button>
                  </div>
                  <div className="mt-3 text-xs font-semibold text-foreground">{text.imagePreviewTitle}</div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {chatImages.map((item) => (
                      <div key={item.id} className="w-[96px]">
                        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                          <img src={item.dataUrl} alt={item.name} className="h-24 w-full object-cover" />
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">{item.name}</div>
                        <button
                          type="button"
                          onClick={() => setChatImages((prev) => prev.filter((image) => image.id !== item.id))}
                          className="mt-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground transition hover:bg-muted"
                        >
                          {text.removeImage}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-1">
                <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
                  <PanelModeSwitch
                    active="ai"
                    onChat={() => {
                      send(appStatusDomain.command.UpdateOpenCommand(true))
                      onClose()
                    }}
                    chatLabel={text.chatTab}
                    aiLabel={text.aiTab}
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <ImageButton
                      disabled={chatLoading || !canChat}
                      onSelect={handleSelectChatImage}
                      onSelectMultiple={handleSelectChatImages}
                      multiple
                    />
                  </div>
                </div>
                <button
                  onClick={sendFollowUpQuestion}
                  disabled={chatLoading || !chatInput.trim() || !canChat}
                  className="shrink-0 rounded-full bg-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/95 transition disabled:opacity-50 flex items-center justify-center min-w-max"
                >
                  <span className="mr-1">{text.chatSend}</span>
                  <CornerDownLeftIcon className="text-primary-foreground/75" size={10}></CornerDownLeftIcon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

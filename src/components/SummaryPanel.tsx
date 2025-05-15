import React, { useEffect, useState } from 'react'
import { useSummarize } from '@/hooks/useSummarize'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import { browser } from 'wxt/browser'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

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
    title: '🧠 AI 摘要',
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
    close: '✕'
  },
  zh_CN: {
    title: '🧠 AI 摘要',
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
    close: '✕'
  },
  en: {
    title: '🧠 AI Summary',
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
    close: '✕'
  }
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ onClose }) => {
  const [language, setLanguage] = useState<Lang>(detectBrowserLang())
  const { summarize, loading, summary } = useSummarize()
  const [pageText, setPageText] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiBaseURL, setApiBaseURL] = useState('https://gemini.david888.com/v1')
  const [apiModelName, setApiModelName] = useState('gemini-2.0-flash')
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const text = LANG_MAP[language]

  // 檢查是否已經設置了 API key
  useEffect(() => {
    browser.storage.sync
      .get(['groqApiKey', 'groqApiBaseURL', 'groqModelName'])
      .then((result: { groqApiKey?: string; groqApiBaseURL?: string; groqModelName?: string }) => {
        if (result.groqApiKey) {
          setApiKey(result.groqApiKey)
          setIsApiKeySet(true)
        }
        if (result.groqApiBaseURL) {
          setApiBaseURL(result.groqApiBaseURL)
        }
        if (result.groqModelName) {
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
        setIsApiKeySet(!!apiKey)
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

  const onClickSummarize = () => {
    if (!isApiKeySet) {
      setShowApiSettings(true)
      alert('請先設置 API key')
      return
    }

    if (pageText) summarize(pageText, language)
    else alert(text.noText)
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

  const markedHtml = marked.parse(summary || text.noContent)

  return (
    <div className="flex size-full flex-col space-y-4 overflow-hidden border-l bg-white p-0 px-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{text.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApiSettings(!showApiSettings)}
            className="text-blue-500 hover:text-blue-700"
            title="API setting 設置"
          >
            ⚙️
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            {text.close}
          </button>
        </div>
      </div>

      {showApiSettings && (
        <div className="space-y-3 rounded border bg-gray-50 p-4">
          <h3 className="text-sm font-semibold">API setting</h3>

          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm">
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
            <Label htmlFor="api-base-url" className="text-sm">
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
            <Label htmlFor="api-model-name" className="text-sm">
              模型名稱
            </Label>
            <Input
              id="api-model-name"
              placeholder="模型名稱"
              value={apiModelName}
              onChange={(e) => setApiModelName(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">預設: gemini-2.0-flash</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowApiSettings(false)}
              className="rounded bg-gray-300 px-3 py-1 text-sm text-black"
            >
              取消
            </button>
            <button onClick={saveApiSettings} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
              保存
            </button>
          </div>
        </div>
      )}

      <select className="rounded border p-2" value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
        <option value="zh_TW">正體中文</option>
        <option value="zh_CN">简体中文</option>
        <option value="en">English</option>
      </select>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClickSummarize}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-300"
        >
          {!isApiKeySet ? '⚠️ Please set API Key first' : loading ? text.loading : text.summarize}
        </button>
        {/* <button
          onClick={speak}
          disabled={!summary}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          🔈 {text.speaking}
        </button> */}
        <button
          onClick={copy}
          disabled={!summary}
          className="rounded bg-gray-700 px-4 py-2 text-white disabled:bg-gray-300"
        >
          📋 {text.copy}
        </button>
        {/* <button
          onClick={exportImage}
          disabled={!summary}
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          🖼️ {text.image}
        </button> */}
        <button
          onClick={exportMarkdown}
          disabled={!summary}
          className="rounded bg-purple-600 px-4 py-2 text-white disabled:bg-gray-300"
        >
          💾 {text.markdown}
        </button>
        {/* <button
          onClick={onClickSummarize}
          disabled={loading || !summary}
          className="bg-orange-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          🔁 {text.retry}
        </button> */}
      </div>

      <div
        id="summary-content"
        className="flex-1 overflow-y-auto whitespace-pre-wrap rounded border bg-gray-50 p-0.5 text-sm"
        dangerouslySetInnerHTML={{ __html: markedHtml }}
      />
    </div>
  )
}

import { useState } from 'react'
import { browser } from 'wxt/browser'
import { FALLBACK_GROQ_API_KEY, FALLBACK_GROQ_BASE_URL, FALLBACK_GROQ_MODEL } from '@/constants/apiDefaults'

export const useSummarize = () => {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')

  const summarize = async (pageText: string, language: 'zh_TW' | 'zh_CN' | 'en') => {
    setLoading(true)
    const targetLanguage = language === 'zh_TW' ? '繁體中文' : language === 'zh_CN' ? '简体中文' : 'English'
    const bulletPointInstruction =
      language === 'zh_TW'
        ? '請使用項目符號。'
        : language === 'zh_CN'
          ? '请使用项目符号。'
          : 'Please use bullet points.'

    const prompt = `將以下内容總結為${targetLanguage}。无论原文是什么语言，请确保摘要使用${targetLanguage}。
  將以下原文總結為五個部分：
1.容易懂(Easy Know) , 一個讓十二歲青少年可以看得動懂的段落。請確保每個部分只生成一次，且內容不重複。確保生成的文字都是${targetLanguage}為主。
2.總結 (Overall Summary)：300字以上**的摘要，完整概括影片的**主要議題、論點與結論**，語氣務實、清楚，避免艱澀詞彙。
3.觀點 (Viewpoints)：中提到的3～7個主要觀點，每點以條列方式呈現，並可加入簡短評論或補充說明。
4.摘要 (Abstract)： 6～10個關鍵重點句**，每點簡短有力，前綴搭配合適的表情符號（如✅、⚠️、📌）。
5.問題測驗 (FAQ)：根據內容產出**三題選擇題**，每題有 A、B、C、D 四個選項，並在每題後附上正確答案及簡短解釋。題目應涵蓋內容的重要概念或關鍵知識點。
  ${bulletPointInstruction}
  将输出格式化为 Markdown 。
  原文内容：\n\n${pageText}`

    const { groqApiKey, groqApiBaseURL, groqModelName } = await browser.storage.sync.get([
      'groqApiKey',
      'groqApiBaseURL',
      'groqModelName'
    ])

    const apiKey = groqApiKey || import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_GROQ_API_KEY
    const baseURL = groqApiBaseURL || import.meta.env.VITE_GEMINI_API_BASE_URL || FALLBACK_GROQ_BASE_URL
    const modelName = groqModelName || import.meta.env.VITE_GEMINI_MODEL_NAME || FALLBACK_GROQ_MODEL

    if (!apiKey) {
      setLoading(false)
      throw new Error('API key is required')
    }

    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName || 'gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: pageText }
        ]
      })
    })

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content || '無摘要結果'
    setSummary(content)
    setLoading(false)
    return content
  }

  const clearSummary = () => setSummary('')

  return { summarize, loading, summary, clearSummary }
}

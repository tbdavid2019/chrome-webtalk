import { useState } from 'react'
import { browser } from 'wxt/browser'

export const useSummarize = () => {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')

  const summarize = async (pageText: string, language: 'zh_TW' | 'zh_CN' | 'en') => {
    setLoading(true)
    const targetLang =
      language === 'zh_TW' ? '繁體中文' :
      language === 'zh_CN' ? '简体中文' : 'English'
    const bulletText =
      language === 'zh_TW' ? '請使用項目符號。' :
      language === 'zh_CN' ? '请使用项目符号。' : 'Please use bullet points.'

    const prompt = `將以下內容總結為${targetLang}。\n\n將以下原文分為五個部分：\n1. 總結\n2. 觀點\n3. 摘要（6-10 點含 emoji）\n4. 關鍵字\n5. 給 12 歲孩子看的版本\n${bulletText}\n\n---\n\n${pageText}`

    const { groqApiKey, groqApiBaseURL, groqModelName } = await browser.storage.sync.get([
      'groqApiKey',
      'groqApiBaseURL',
      'groqModelName'
    ])

    const res = await fetch(`${groqApiBaseURL || 'https://gemini.david888.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: groqModelName || 'gemini-2.0-flash-exp',
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
  }

  return { summarize, loading, summary }
}
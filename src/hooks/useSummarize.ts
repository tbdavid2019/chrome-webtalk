import { useState } from 'react'
import { requestAiCompletion } from '@/utils'

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

    const pageExcerpt = pageText.trim().slice(0, 12000)
    const prompt = `將以下网页內容總結為${targetLanguage}。无论原文是什么语言，请确保摘要使用${targetLanguage}。
  請把內容整理為五個部分：
1.容易懂(Easy Know) , 一個讓十二歲青少年可以看得動懂的段落。請確保每個部分只生成一次，且內容不重複。確保生成的文字都是${targetLanguage}為主。
2.總結 (Overall Summary)：300字以上**的摘要，完整概括影片的**主要議題、論點與結論**，語氣務實、清楚，避免艱澀詞彙。
3.觀點 (Viewpoints)：中提到的3～7個主要觀點，每點以條列方式呈現，並可加入簡短評論或補充說明。
4.摘要 (Abstract)： 6～10個關鍵重點句**，每點簡短有力，前綴搭配合適的表情符號（如✅、⚠️、📌）。
5.問題測驗 (FAQ)：根據內容產出**三題選擇題**，每題有 A、B、C、D 四個選項，並在每題後附上正確答案及簡短解釋。題目應涵蓋內容的重要概念或關鍵知識點。
  ${bulletPointInstruction}
  将输出格式化为 Markdown 。
  原文内容：\n\n${pageExcerpt}`

    try {
      const result = await requestAiCompletion({
        messages: [{ role: 'system', content: prompt }]
      })
      setSummary(result.content)
      setLoading(false)
      return result.content
    } catch (error) {
      setLoading(false)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `API呼叫失敗 (${message})。這可能是因為 API Key、模型或內容長度設定有誤。請檢查 Groq API 設定。`
      )
    }
  }

  const clearSummary = () => setSummary('')
  const restoreSummary = (content: string) => setSummary(content)

  return { summarize, loading, summary, clearSummary, restoreSummary }
}

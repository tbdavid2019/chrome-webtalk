import { FC, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { browser } from 'wxt/browser'
import { ToastImpl } from '@/domain/impls/Toast'

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'moonshotai/kimi-k2-instruct-0905'

const ApiSettingsForm: FC = () => {
  const toast = ToastImpl.value
  const [apiKey, setApiKey] = useState('')
  const [apiBaseURL, setApiBaseURL] = useState(DEFAULT_BASE_URL)
  const [apiModelName, setApiModelName] = useState(DEFAULT_MODEL)
  const [loading, setLoading] = useState(false)
  const [savedValues, setSavedValues] = useState({
    apiKey: '',
    apiBaseURL: DEFAULT_BASE_URL,
    apiModelName: DEFAULT_MODEL
  })

  useEffect(() => {
    browser.storage.sync
      .get(['groqApiKey', 'groqApiBaseURL', 'groqModelName'])
      .then(({ groqApiKey, groqApiBaseURL, groqModelName }) => {
        const nextValues = {
          apiKey: groqApiKey ?? '',
          apiBaseURL: groqApiBaseURL ?? DEFAULT_BASE_URL,
          apiModelName: groqModelName ?? DEFAULT_MODEL
        }
        setApiKey(nextValues.apiKey)
        setApiBaseURL(nextValues.apiBaseURL)
        setApiModelName(nextValues.apiModelName)
        setSavedValues(nextValues)
      })
      .catch((error) => {
        console.error('[WebTalk] 無法載入 API 設定', error)
        toast.error('Failed to load API settings / 載入 API 設定失敗')
      })
  }, [toast])

  const handleReset = () => {
    setApiKey(savedValues.apiKey)
    setApiBaseURL(savedValues.apiBaseURL)
    setApiModelName(savedValues.apiModelName)
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter API Key / 請輸入 API Key')
      return
    }
    setLoading(true)
    try {
      await browser.storage.sync.set({
        groqApiKey: apiKey.trim(),
        groqApiBaseURL: apiBaseURL.trim() || DEFAULT_BASE_URL,
        groqModelName: apiModelName.trim() || DEFAULT_MODEL
      })
      const nextValues = {
        apiKey: apiKey.trim(),
        apiBaseURL: apiBaseURL.trim() || DEFAULT_BASE_URL,
        apiModelName: apiModelName.trim() || DEFAULT_MODEL
      }
      setSavedValues(nextValues)
      toast.success('API settings saved! / API 設定已保存')
    } catch (error) {
      console.error('[WebTalk] 無法保存 API 設定', error)
      toast.error('Failed to save API settings / API 設定保存失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-[450px] space-y-6 rounded-xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <div>
        <h2 className="text-xl font-semibold">API setting / AI 服務設定</h2>
        <p className="text-sm text-muted-foreground">
          設定 Gemini/GROQ API Key 與模型參數，供 AI 摘要功能使用。
        </p>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">
          Gemini API Key <span className="text-red-500">*</span>
        </Label>
        <Input
          type="password"
          value={apiKey}
          placeholder="your Gemini API key / 請輸入 API Key"
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">API Base URL / 伺服器位址</Label>
        <Input
          value={apiBaseURL}
          placeholder={DEFAULT_BASE_URL}
          onChange={(event) => setApiBaseURL(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Default: {DEFAULT_BASE_URL}</p>
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">Model Name / 模型名稱</Label>
        <Input
          value={apiModelName}
          placeholder={DEFAULT_MODEL}
          onChange={(event) => setApiModelName(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Default: {DEFAULT_MODEL}</p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleReset} disabled={loading}>
          Reset / 重設
        </Button>
        <Button type="button" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save / 保存'}
        </Button>
      </div>
    </section>
  )
}

ApiSettingsForm.displayName = 'ApiSettingsForm'

export default ApiSettingsForm

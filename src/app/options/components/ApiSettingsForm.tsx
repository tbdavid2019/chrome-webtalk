import { FC, useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { ToastImpl } from '@/domain/impls/Toast'
import {
  FALLBACK_GROQ_API_KEY,
  FALLBACK_GROQ_BASE_URL,
  FALLBACK_GROQ_MODEL,
  FALLBACK_GROQ_VISION_MODEL
} from '@/constants/apiDefaults'
import { loadApiProviderSettings, loadApiSettings, saveApiSettings } from '@/utils/apiSettingsStorage'
import { testAiConnection } from '@/utils/aiClient'
import { API_PROVIDERS, getApiProvider, type ApiProvider } from '@/utils/apiProviders'
import { fetchApiModels, type ApiModelOption } from '@/utils/apiModels'

const DEFAULT_BASE_URL = FALLBACK_GROQ_BASE_URL
const DEFAULT_MODEL = FALLBACK_GROQ_MODEL
const DEFAULT_VISION_MODEL = FALLBACK_GROQ_VISION_MODEL

const ApiSettingsForm: FC = () => {
  const toast = ToastImpl.value
  const [provider, setProvider] = useState<ApiProvider>('groq')
  const [apiKey, setApiKey] = useState(FALLBACK_GROQ_API_KEY)
  const [apiBaseURL, setApiBaseURL] = useState(DEFAULT_BASE_URL)
  const [apiModelName, setApiModelName] = useState(DEFAULT_MODEL)
  const [apiVisionModelName, setApiVisionModelName] = useState(DEFAULT_VISION_MODEL)
  const [loading, setLoading] = useState(false)
  const [providerLoading, setProviderLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('')
  const [models, setModels] = useState<ApiModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsStatus, setModelsStatus] = useState('')
  const [savedValues, setSavedValues] = useState({
    provider: 'groq' as ApiProvider,
    apiKey: FALLBACK_GROQ_API_KEY,
    apiBaseURL: DEFAULT_BASE_URL,
    apiModelName: DEFAULT_MODEL,
    apiVisionModelName: DEFAULT_VISION_MODEL
  })

  useEffect(() => {
    loadApiSettings()
      .then((nextValues) => {
        setProvider(nextValues.provider)
        setApiKey(nextValues.apiKey)
        setApiBaseURL(nextValues.apiBaseURL)
        setApiModelName(nextValues.apiModelName)
        setApiVisionModelName(nextValues.apiVisionModelName)
        setSavedValues(nextValues)
      })
      .catch((error) => {
        console.error('[WebTalk] 無法載入 API 設定', error)
        toast.error('Failed to load API settings / 載入 API 設定失敗')
      })
  }, [toast])

  const handleReset = () => {
    setProvider(savedValues.provider)
    setApiKey(savedValues.apiKey)
    setApiBaseURL(savedValues.apiBaseURL)
    setApiModelName(savedValues.apiModelName)
    setApiVisionModelName(savedValues.apiVisionModelName)
    setModels([])
    setModelsStatus('')
    setConnectionStatus('')
  }

  const handleProviderChange = async (nextProvider: ApiProvider) => {
    setProviderLoading(true)
    setProvider(nextProvider)
    setModels([])
    setModelsStatus('')
    setConnectionStatus('')
    try {
      const settings = await loadApiProviderSettings(nextProvider)
      setApiKey(settings.apiKey)
      setApiBaseURL(settings.apiBaseURL)
      setApiModelName(settings.apiModelName)
      setApiVisionModelName(settings.apiVisionModelName)
    } catch (error) {
      console.error('[WebTalk] 無法載入供應商設定', error)
      setApiKey('')
      setApiBaseURL(getApiProvider(nextProvider).baseURL)
      setApiModelName('')
      setApiVisionModelName('')
      setModelsStatus('無法載入此供應商的已保存設定。')
    } finally {
      setProviderLoading(false)
    }
  }

  const handleFetchModels = async () => {
    const nextValues = {
      provider,
      apiKey: apiKey.trim(),
      apiBaseURL: apiBaseURL.trim(),
      apiModelName: apiModelName.trim(),
      apiVisionModelName: apiVisionModelName.trim() || DEFAULT_VISION_MODEL
    }
    setModelsLoading(true)
    setModelsStatus('正在驗證 API Key 並取得模型…')
    try {
      const availableModels = await fetchApiModels(nextValues)
      setModels(availableModels)
      setModelsStatus(`已取得 ${availableModels.length} 個模型。`)
      if (!availableModels.some((model) => model.id === apiModelName)) setApiModelName(availableModels[0].id)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      setModels([])
      setModelsStatus(`取得模型失敗：${detail}`)
    } finally {
      setModelsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim() && provider !== 'groq') {
      toast.error('Please enter API Key / 請輸入 API Key')
      return
    }
    if (!apiBaseURL.trim() || !apiModelName.trim()) {
      toast.error('Please enter an API Base URL and model / 請填寫 API Base URL 與模型名稱')
      return
    }
    setLoading(true)
    setConnectionStatus('')
    const nextValues = {
      provider,
      apiKey: apiKey.trim(),
      apiBaseURL: apiBaseURL.trim(),
      apiModelName: apiModelName.trim(),
      apiVisionModelName: apiVisionModelName.trim() || apiModelName.trim()
    }
    try {
      await saveApiSettings(nextValues)
      setSavedValues(nextValues)
    } catch (error) {
      console.error('[WebTalk] 無法保存 API 設定', error)
      toast.error('Failed to save API settings / API 設定保存失敗')
      setConnectionStatus('設定無法保存，請檢查瀏覽器儲存空間。')
      setLoading(false)
      return
    }

    setConnectionStatus('設定已保存，正在測試 API 連線…')
    try {
      await testAiConnection(nextValues)
      setConnectionStatus('API 連線測試成功，設定已保存。')
      toast.success('API connection test passed / API 連線測試成功')
    } catch (error) {
      console.error('[WebTalk] API 連線測試失敗', error)
      const detail = error instanceof Error ? error.message : String(error)
      setConnectionStatus(`設定已保存，但 API 測試失敗：${detail}`)
      toast.error('Settings saved, but API connection test failed / 設定已保存，但 API 連線測試失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-[450px] space-y-6 rounded-2xl border border-border/80 bg-card p-8 shadow-sm backdrop-blur text-card-foreground">
      <div>
        <h2 className="text-xl font-semibold">API setting / AI 服務設定</h2>
        <p className="text-sm text-muted-foreground">
          選擇 AI 服務供應商，輸入 API Key 後可取得該金鑰可用的模型。OpenAI API 需另外計費，ChatGPT 訂閱不包含 API 額度。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-provider" className="font-semibold">Provider / 服務供應商</Label>
        <select
          id="api-provider"
          value={provider}
          disabled={providerLoading || loading}
          onChange={(event) => void handleProviderChange(event.target.value as ApiProvider)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {API_PROVIDERS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key" className="font-semibold flex items-center justify-between">
          <span>{getApiProvider(provider).label} API Key {provider !== 'groq' && <span className="text-destructive">*</span>}</span>
          {getApiProvider(provider).keyURL && (
            <a href={getApiProvider(provider).keyURL} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
              取得 API Key
            </a>
          )}
        </Label>
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          placeholder={provider === 'groq' ? '留空使用 WebTalk 免費額度，或輸入個人 Key' : `請輸入 ${getApiProvider(provider).label} API Key`}
          onChange={(event) => {
            setApiKey(event.target.value)
            setModels([])
            setModelsStatus('')
          }}
        />
        {provider === 'groq' && !apiKey.trim() && (
          <p className="text-xs text-primary font-medium">
            💡 目前模式：使用 WebTalk 免費體驗額度（由 Groq 提供），無需自備 Key。
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">API Base URL / 伺服器位址</Label>
        <Input
          value={apiBaseURL}
          placeholder={getApiProvider(provider).baseURL || 'https://your-api.example/v1'}
          onChange={(event) => {
            setApiBaseURL(event.target.value)
            setModels([])
            setModelsStatus('')
          }}
        />
        <p className="text-xs text-muted-foreground">
          Default: {getApiProvider(provider).baseURL || 'Enter an OpenAI-compatible API base URL'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="api-model-name" className="font-semibold">Model Name / 模型名稱</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleFetchModels} disabled={modelsLoading || providerLoading || loading}>
            {modelsLoading ? '讀取中…' : '取得模型'}
          </Button>
        </div>
        <Input
          id="api-model-name"
          list="api-model-options"
          value={apiModelName}
          placeholder="從模型清單選擇，或輸入模型 ID"
          onChange={(event) => setApiModelName(event.target.value)}
        />
        <datalist id="api-model-options">
          {models.map((model) => <option key={model.id} value={model.id}>{model.name || model.id}</option>)}
        </datalist>
        {modelsStatus && <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{modelsStatus}</p>}
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">Vision Model / 視覺模型</Label>
        <Input
          list="api-model-options"
          value={apiVisionModelName}
          placeholder="留白時沿用文字模型"
          onChange={(event) => setApiVisionModelName(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">可選擇支援圖片輸入的模型；留白時沿用文字模型。</p>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleReset} disabled={loading || providerLoading}>
          Reset / 重設
        </Button>
        <Button type="button" onClick={handleSave} disabled={loading || providerLoading}>
          {loading ? 'Saving and testing...' : 'Save and test / 保存並測試'}
        </Button>
      </div>
      {connectionStatus && (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {connectionStatus}
        </p>
      )}
    </section>
  )
}

ApiSettingsForm.displayName = 'ApiSettingsForm'

export default ApiSettingsForm

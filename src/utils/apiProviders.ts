export const API_PROVIDERS = [
  {
    id: 'groq',
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    keyURL: 'https://console.groq.com/keys'
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyURL: 'https://aistudio.google.com/apikey'
  },
  {
    id: 'xai',
    label: 'xAI Grok',
    baseURL: 'https://api.x.ai/v1',
    keyURL: 'https://console.x.ai/'
  },
  {
    id: 'openai',
    label: 'OpenAI API（ChatGPT）',
    baseURL: 'https://api.openai.com/v1',
    keyURL: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    keyURL: 'https://platform.deepseek.com/api_keys'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    keyURL: 'https://openrouter.ai/settings/keys'
  },
  {
    id: 'custom',
    label: '自訂 OpenAI 相容 API',
    baseURL: '',
    keyURL: ''
  }
] as const

export type ApiProvider = (typeof API_PROVIDERS)[number]['id']

export const isApiProvider = (provider: unknown): provider is ApiProvider =>
  typeof provider === 'string' && API_PROVIDERS.some((option) => option.id === provider)

export const getApiProvider = (provider: string) => {
  const option = API_PROVIDERS.find((item) => item.id === provider)
  if (!option) throw new Error(`Unsupported AI provider: ${provider}`)
  return option
}

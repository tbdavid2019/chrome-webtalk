type AiRoute = 'text' | 'vision'

interface AiRequestBody {
  messages?: unknown
  route?: AiRoute
}

interface VercelRequestLike {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

interface VercelResponseLike {
  status: (statusCode: number) => VercelResponseLike
  setHeader: (name: string, value: string) => void
  end: (body?: string) => void
}

const DEFAULT_ALLOWED_ORIGINS = new Set(['*'])

const setHeaders = (response: VercelResponseLike, headers: Record<string, string>): void => {
  Object.entries(headers).forEach(([name, value]) => response.setHeader(name, value))
}

const json = (
  response: VercelResponseLike,
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): void => {
  response.status(status)
  setHeaders(response, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  })
  response.end(JSON.stringify(body))
}

const getHeader = (request: VercelRequestLike, name: string): string => {
  const value = request.headers[name.toLowerCase()]
  return typeof value === 'string' ? value : ''
}

const getAllowedOrigin = (request: VercelRequestLike): string => {
  const requestOrigin = getHeader(request, 'origin')
  const configuredOrigins = (process.env.WEBTALK_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const allowedOrigins = configuredOrigins.length > 0 ? new Set(configuredOrigins) : DEFAULT_ALLOWED_ORIGINS
  if (allowedOrigins.has('*')) return '*'
  if (requestOrigin && allowedOrigins.has(requestOrigin)) return requestOrigin
  return ''
}

const corsHeaders = (origin: string): Record<string, string> => ({
  ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin'
})

const isValidMessages = (messages: unknown): messages is Array<Record<string, unknown>> => {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 24 &&
    messages.every((message) => message && typeof message === 'object' && typeof message.role === 'string')
  )
}

export default async function handler(request: VercelRequestLike, response: VercelResponseLike): Promise<void> {
  const origin = getAllowedOrigin(request)
  const headers = corsHeaders(origin)
  setHeaders(response, headers)

  if (request.method === 'OPTIONS') {
    response.status(origin ? 204 : 403).end()
    return
  }

  if (!origin) {
    json(
      response,
      { error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This website is not allowed to use WebTalk AI.' } },
      403,
      headers
    )
    return
  }

  if (request.method !== 'POST') {
    json(response, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' } }, 405, headers)
    return
  }

  const apiKey = process.env.LLM_API_KEY?.trim()
  if (!apiKey) {
    json(response, { error: { code: 'AI_NOT_CONFIGURED', message: 'The AI service is not configured.' } }, 503, headers)
    return
  }

  let body: AiRequestBody
  try {
    body = (typeof request.body === 'string' ? JSON.parse(request.body) : request.body) as AiRequestBody
  } catch {
    json(response, { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } }, 400, headers)
    return
  }

  if (!isValidMessages(body.messages)) {
    json(
      response,
      { error: { code: 'INVALID_MESSAGES', message: 'A non-empty messages array is required.' } },
      422,
      headers
    )
    return
  }

  const serializedMessages = JSON.stringify(body.messages)
  if (serializedMessages.length > 500_000) {
    json(response, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'The AI request is too large.' } }, 413, headers)
    return
  }

  const route: AiRoute = body.route === 'vision' ? 'vision' : 'text'
  const model =
    route === 'vision'
      ? process.env.LLM_VISION_MODEL?.trim() || 'meta-llama/llama-4-scout-17b-16e-instruct'
      : process.env.LLM_MODEL?.trim() || 'openai/gpt-oss-120b'
  const defaultBaseURL = 'https://api.groq.com/openai/v1'
  const baseURL = (
    route === 'vision'
      ? process.env.LLM_VISION_BASE_URL?.trim() || process.env.LLM_BASE_URL?.trim() || defaultBaseURL
      : process.env.LLM_BASE_URL?.trim() || defaultBaseURL
  ).replace(/\/$/, '')

  try {
    const upstream = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: body.messages
      })
    })

    const responseBody = await upstream.text()
    response.status(upstream.status)
    setHeaders(response, {
      ...headers,
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
    })
    response.end(responseBody)
  } catch {
    json(
      response,
      { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'The AI provider is unavailable.' } },
      502,
      headers
    )
  }
}

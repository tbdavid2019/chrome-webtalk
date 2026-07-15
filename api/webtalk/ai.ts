type AiRoute = 'text' | 'vision'

interface AiRequestBody {
  messages?: unknown
  route?: AiRoute
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  })

const getAllowedOrigin = (request: Request): string => {
  const requestOrigin = request.headers.get('origin') || ''
  const configuredOrigins = (process.env.WEBTALK_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins.includes('*')) return '*'
  if (requestOrigin && configuredOrigins.includes(requestOrigin)) return requestOrigin
  return configuredOrigins.length === 0 ? '*' : ''
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

export default async function handler(request: Request): Promise<Response> {
  const origin = getAllowedOrigin(request)
  const headers = corsHeaders(origin)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: origin ? 204 : 403, headers })
  }

  if (!origin) {
    return json(
      { error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This website is not allowed to use WebTalk AI.' } },
      403,
      headers
    )
  }

  if (request.method !== 'POST') {
    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' } }, 405, headers)
  }

  const apiKey = process.env.LLM_API_KEY?.trim()
  if (!apiKey) {
    return json({ error: { code: 'AI_NOT_CONFIGURED', message: 'The AI service is not configured.' } }, 503, headers)
  }

  let body: AiRequestBody
  try {
    body = (await request.json()) as AiRequestBody
  } catch {
    return json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } }, 400, headers)
  }

  if (!isValidMessages(body.messages)) {
    return json(
      { error: { code: 'INVALID_MESSAGES', message: 'A non-empty messages array is required.' } },
      422,
      headers
    )
  }

  const serializedMessages = JSON.stringify(body.messages)
  if (serializedMessages.length > 500_000) {
    return json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The AI request is too large.' } }, 413, headers)
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
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        ...headers,
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
      }
    })
  } catch {
    return json({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'The AI provider is unavailable.' } }, 502, headers)
  }
}

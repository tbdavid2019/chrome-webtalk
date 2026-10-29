interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
  LLM_API_KEY?: string
  LLM_MODEL?: string
  LLM_BASE_URL?: string
  LLM_VISION_MODEL?: string
  LLM_VISION_BASE_URL?: string
}

const PREVIEW_ORIGIN_PLACEHOLDER = 'https://__WEBTALK_PREVIEW_ORIGIN__'
const VERCEL_API_HOST = 'webtalk-nine.vercel.app'
const GUIDE_PATHS = new Set(['/', '/index.html', '/en.html'])

const handleAiRequest = async (request: Request, env: Env): Promise<Response> => {
  const origin = request.headers.get('origin') || '*'
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Only POST is supported.' } }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    })
  }

  const apiKey = env.LLM_API_KEY?.trim()
  if (!apiKey) {
    return proxyAiRequest(request)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON request body.' } }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    })
  }

  const route = body?.route === 'vision' ? 'vision' : 'text'
  const defaultModel = route === 'vision' ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'openai/gpt-oss-120b'
  const model = (route === 'vision' ? env.LLM_VISION_MODEL : env.LLM_MODEL) || body?.model || defaultModel
  const defaultBaseURL = 'https://api.groq.com/openai/v1'
  const baseURL = (
    route === 'vision'
      ? env.LLM_VISION_BASE_URL || env.LLM_BASE_URL || defaultBaseURL
      : env.LLM_BASE_URL || defaultBaseURL
  ).replace(/\/+$/, '')

  try {
    const upstream = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        ...(body.max_tokens ? { max_tokens: body.max_tokens } : {}),
        ...(Array.isArray(body.tools) && body.tools.length ? { tools: body.tools, tool_choice: body.tool_choice || 'auto' } : {})
      })
    })

    const upstreamBody = await upstream.text()
    return new Response(upstreamBody, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: { message: `AI request failed (${message}).` } }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
    })
  }
}

const proxyAiRequest = async (request: Request): Promise<Response> => {
  const upstreamUrl = new URL(request.url)
  upstreamUrl.protocol = 'https:'
  upstreamUrl.hostname = VERCEL_API_HOST
  upstreamUrl.port = ''

  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
    redirect: 'manual'
  }

  if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  return fetch(upstreamUrl, init)
}

const rewriteGuideOrigin = async (request: Request, response: Response): Promise<Response> => {
  const requestUrl = new URL(request.url)
  const contentType = response.headers.get('content-type') || ''

  if (
    !response.ok ||
    !GUIDE_PATHS.has(requestUrl.pathname) ||
    !contentType.includes('text/html')
  ) {
    return response
  }

  const body = (await response.text()).replaceAll(PREVIEW_ORIGIN_PLACEHOLDER, requestUrl.origin)
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('etag')

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/webtalk/ai') {
      return handleAiRequest(request, env)
    }

    const response = await env.ASSETS.fetch(request)
    return rewriteGuideOrigin(request, response)
  }
}

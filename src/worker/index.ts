interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

const PREVIEW_ORIGIN_PLACEHOLDER = 'https://__WEBTALK_PREVIEW_ORIGIN__'
const VERCEL_API_HOST = 'webtalk-nine.vercel.app'
const GUIDE_PATHS = new Set(['/', '/index.html', '/en.html'])

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
      return proxyAiRequest(request)
    }

    const response = await env.ASSETS.fetch(request)
    return rewriteGuideOrigin(request, response)
  }
}

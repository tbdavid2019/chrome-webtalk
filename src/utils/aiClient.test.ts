import assert from 'node:assert/strict'
import test from 'node:test'
import { configurePlatform, getPlatform, type PlatformAdapter, type PlatformStorage } from '../platform/index.ts'
import { loadAiApiConfig, requestAiCompletion, testAiConnection } from './aiClient.ts'

const makePlatform = (storedSettings: unknown = null): PlatformAdapter => {
  const storage: PlatformStorage = {
    async get<T>() {
      return storedSettings as T | null
    },
    async getAll() {
      return {}
    },
    async set() {},
    async remove() {},
    async clear() {},
    watch() {
      return () => undefined
    }
  }
  return {
    storage,
    ai: {
      mode: 'direct',
      endpoint: 'https://api.groq.com/openai/v1',
      apiKey: 'free-groq-starter-key',
      model: 'test-model',
      visionModel: 'test-model'
    },
    getPageContent: () => '',
    openSettings: () => undefined,
    openHistory: () => undefined,
    pushNotification: async (message) => message.id
  }
}

test('does not apply the Groq starter key to another provider with a blank saved key', async () => {
  const originalPlatform = getPlatform()
  configurePlatform(
    makePlatform({
      provider: 'gemini',
      apiKey: '',
      apiBaseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiModelName: 'gemini-model',
      apiVisionModelName: 'gemini-model'
    })
  )

  try {
    const config = await loadAiApiConfig()
    assert.equal(config.apiKey, '')
    assert.equal(config.baseURL, 'https://generativelanguage.googleapis.com/v1beta/openai')
  } finally {
    configurePlatform(originalPlatform)
  }
})

test('tests the selected provider with a capped prompt and selected credentials', async () => {
  const originalPlatform = getPlatform()
  const originalFetch = globalThis.fetch
  let requestUrl = ''
  let requestHeaders: HeadersInit | undefined
  let requestBody = ''
  configurePlatform(makePlatform())
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestHeaders = init?.headers
    requestBody = String(init?.body)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    await testAiConnection({
      provider: 'gemini',
      apiKey: 'selected-provider-key',
      apiBaseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiModelName: 'gemini-test-model',
      apiVisionModelName: 'gemini-test-model'
    })
    assert.equal(requestUrl, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')
    assert.equal(new Headers(requestHeaders).get('Authorization'), 'Bearer selected-provider-key')
    assert.equal(JSON.parse(requestBody).model, 'gemini-test-model')
    assert.equal(JSON.parse(requestBody).max_tokens, 8)
    assert.deepEqual(JSON.parse(requestBody).messages, [{ role: 'user', content: 'Reply with OK only.' }])
  } finally {
    globalThis.fetch = originalFetch
    configurePlatform(originalPlatform)
  }
})

test('normalizes a models URL with a trailing slash before requesting chat completions', async () => {
  const originalPlatform = getPlatform()
  const originalFetch = globalThis.fetch
  let requestUrl = ''
  configurePlatform(makePlatform())
  globalThis.fetch = async (input) => {
    requestUrl = String(input)
    return new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    await requestAiCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      apiKey: 'test-key',
      baseURL: 'https://api.example/v1/models/',
      model: 'test-model'
    })
    assert.equal(requestUrl, 'https://api.example/v1/chat/completions')
  } finally {
    globalThis.fetch = originalFetch
    configurePlatform(originalPlatform)
  }
})

test('reports HTTP status for a non-JSON API error response', async () => {
  const originalPlatform = getPlatform()
  const originalFetch = globalThis.fetch
  configurePlatform(makePlatform())
  globalThis.fetch = async () => new Response('<html>upstream unavailable</html>', { status: 502 })

  try {
    await assert.rejects(
      requestAiCompletion({
        messages: [{ role: 'user', content: 'Hello' }],
        apiKey: 'test-key',
        baseURL: 'https://api.example/v1',
        model: 'test-model'
      }),
      /HTTP 502/
    )
  } finally {
    globalThis.fetch = originalFetch
    configurePlatform(originalPlatform)
  }
})

test('routes to the WebTalk AI proxy when apiKey is empty', async () => {
  const originalPlatform = getPlatform()
  const originalFetch = globalThis.fetch
  let requestUrl = ''
  let requestHeaders: HeadersInit | undefined
  configurePlatform(makePlatform({ provider: 'groq', apiKey: '' }))
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestHeaders = init?.headers
    return new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const result = await requestAiCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      apiKey: '',
      model: 'openai/gpt-oss-120b'
    })
    assert.equal(requestUrl, 'https://webtalk.david888.com/api/webtalk/ai')
    assert.equal(new Headers(requestHeaders).has('Authorization'), false)
    assert.equal(result.content, 'OK')
  } finally {
    globalThis.fetch = originalFetch
    configurePlatform(originalPlatform)
  }
})

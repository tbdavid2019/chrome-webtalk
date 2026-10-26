import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchApiModels, parseApiModels } from './apiModels.ts'

test('parses and sorts provider model IDs', () => {
  assert.deepEqual(
    parseApiModels({ data: [{ id: 'model-z' }, { id: 'model-a', name: 'Model A' }, { name: 'missing id' }, null] }),
    [{ id: 'model-a', name: 'Model A' }, { id: 'model-z', name: undefined }]
  )
})

test('reports HTTP status when the provider returns a non-JSON error', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('<html>gateway error</html>', { status: 502, statusText: 'Bad Gateway' })
  try {
    await assert.rejects(
      fetchApiModels({
        provider: 'groq',
        apiKey: 'test-key',
        apiBaseURL: 'https://api.groq.com/openai/v1/',
        apiModelName: '',
        apiVisionModelName: ''
      }),
      /HTTP 502 Bad Gateway/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

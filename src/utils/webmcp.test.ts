import assert from 'node:assert/strict'
import test from 'node:test'
import { executeWebMcpTool, normalizeWebMcpTools, serializeWebMcpResult, subscribeWebMcpToolChanges } from './webmcp.ts'

test('normalizes WebMCP schemas returned as JSON strings', () => {
  const registry = normalizeWebMcpTools([
    {
      name: 'addTodo',
      description: 'Add a todo',
      inputSchema: '{"type":"object","properties":{"text":{"type":"string"}}}',
      annotations: { readOnlyHint: false }
    },
    {
      name: 'addTodo',
      description: 'Duplicate should be ignored',
      inputSchema: { type: 'object' }
    },
    {
      name: 'getStatus',
      inputSchema: { type: 'object', properties: {} }
    }
  ])

  assert.deepEqual(
    registry.definitions.map((item) => item.function.name),
    ['addTodo', 'getStatus']
  )
  assert.equal(registry.definitions[0].function.parameters.type, 'object')
  assert.match(registry.definitions[0].function.description ?? '', /change page state/)
  assert.equal(registry.handles.get('addTodo')?.tool.name, 'addTodo')
})

test('serializes tool results without throwing on circular values', () => {
  const circular: Record<string, unknown> = {}
  circular.self = circular
  assert.match(serializeWebMcpResult(circular), /\[object Object\]/)
  assert.equal(serializeWebMcpResult(undefined), 'The tool completed without a return value.')
})

test('passes JSON-string arguments to the browser WebMCP API', async () => {
  let receivedArguments = ''
  const previousDocument = (globalThis as Record<string, unknown>).document
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      modelContext: {
        executeTool: async (_tool: unknown, argumentsJson: string) => {
          receivedArguments = argumentsJson
          return 'ok'
        }
      }
    }
  })

  try {
    const registry = normalizeWebMcpTools([{ name: 'addTodo' }])
    assert.equal(await executeWebMcpTool(registry.handles.get('addTodo')!, { text: 'Buy milk' }), 'ok')
    assert.equal(receivedArguments, '{"text":"Buy milk"}')
  } finally {
    if (previousDocument === undefined) {
      delete (globalThis as Record<string, unknown>).document
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
  }
})

test('subscribes and unsubscribes from WebMCP tool changes', () => {
  let listener: ((event: Event) => void) | undefined
  const previousDocument = (globalThis as Record<string, unknown>).document
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      modelContext: {
        addEventListener: (_type: string, nextListener: (event: Event) => void) => {
          listener = nextListener
        },
        removeEventListener: (_type: string, removedListener: (event: Event) => void) => {
          if (listener === removedListener) listener = undefined
        }
      }
    }
  })

  try {
    let changes = 0
    const unsubscribe = subscribeWebMcpToolChanges(() => {
      changes += 1
    })
    listener?.(new Event('toolchange'))
    assert.equal(changes, 1)
    unsubscribe()
    listener?.(new Event('toolchange'))
    assert.equal(changes, 1)
  } finally {
    if (previousDocument === undefined) {
      delete (globalThis as Record<string, unknown>).document
    } else {
      Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument })
    }
  }
})

/**
 * WebMCP is experimental and is not included in every DOM lib version.
 * Keep the browser-facing surface here so the AI client stays portable.
 */
export interface WebMcpTool {
  name: string
  title?: string
  description?: string
  inputSchema?: string | Record<string, unknown>
  origin?: string
  annotations?: Record<string, unknown>
  [key: string]: unknown
}

export interface WebMcpModelContext {
  getTools(options?: { fromOrigins?: string[] }): Promise<WebMcpTool[]>
  executeTool(tool: WebMcpTool, argumentsJson: string, options?: { signal?: AbortSignal }): Promise<unknown>
  addEventListener(type: 'toolchange', listener: (event: Event) => void): void
  removeEventListener(type: 'toolchange', listener: (event: Event) => void): void
}

export interface AiToolDefinition {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters: Record<string, unknown>
  }
}

export interface WebMcpToolHandle {
  definition: AiToolDefinition
  tool: WebMcpTool
}

export interface WebMcpToolRegistry {
  definitions: AiToolDefinition[]
  handles: Map<string, WebMcpToolHandle>
}

const MAX_TOOLS = 32

const parseInputSchema = (schema: WebMcpTool['inputSchema']): Record<string, unknown> => {
  if (!schema) return { type: 'object', properties: {} }
  if (typeof schema === 'object') return schema

  try {
    const parsed = JSON.parse(schema)
    return parsed && typeof parsed === 'object' ? parsed : { type: 'object', properties: {} }
  } catch {
    return { type: 'object', properties: {} }
  }
}

const getModelContext = (): WebMcpModelContext | undefined => {
  if (typeof document === 'undefined') return undefined
  return document.modelContext
}

export const isWebMcpAvailable = (): boolean => Boolean(getModelContext())

export const subscribeWebMcpToolChanges = (onChange: () => void): (() => void) => {
  const modelContext = getModelContext()
  if (!modelContext) return () => undefined

  const listener = () => onChange()
  modelContext.addEventListener('toolchange', listener)
  return () => modelContext.removeEventListener('toolchange', listener)
}

/** Convert RegisteredTool objects into OpenAI-compatible tools. */
export const normalizeWebMcpTools = (tools: WebMcpTool[]): WebMcpToolRegistry => {
  const definitions: AiToolDefinition[] = []
  const handles = new Map<string, WebMcpToolHandle>()

  for (const tool of tools) {
    const name = typeof tool.name === 'string' ? tool.name.trim() : ''
    if (!name || handles.has(name)) continue

    const baseDescription = typeof tool.description === 'string' ? tool.description.trim() : ''
    const readOnlyHint = tool.annotations?.readOnlyHint
    const safetyNote =
      readOnlyHint === false
        ? ' This tool can change page state; use it only when the user explicitly requests that action.'
        : ''
    const description = `${baseDescription}${safetyNote}`.trim() || undefined
    const definition: AiToolDefinition = {
      type: 'function',
      function: {
        name,
        ...(description ? { description } : {}),
        parameters: parseInputSchema(tool.inputSchema)
      }
    }

    definitions.push(definition)
    handles.set(name, { definition, tool })
    if (definitions.length >= MAX_TOOLS) break
  }

  return { definitions, handles }
}

/** Discover current-page and same-origin frame tools. */
export const getWebMcpTools = async (): Promise<WebMcpToolRegistry> => {
  const modelContext = getModelContext()
  if (!modelContext) return { definitions: [], handles: new Map() }

  try {
    return normalizeWebMcpTools(await modelContext.getTools())
  } catch (error) {
    console.warn('[WebTalk] WebMCP tool discovery failed', error)
    return { definitions: [], handles: new Map() }
  }
}

export const executeWebMcpTool = async (handle: WebMcpToolHandle, argumentsValue: unknown): Promise<unknown> => {
  const modelContext = getModelContext()
  if (!modelContext) throw new Error('WebMCP is not available in this browser')

  // Chrome's current imperative API accepts a JSON string.
  return modelContext.executeTool(handle.tool, JSON.stringify(argumentsValue ?? {}))
}

export const serializeWebMcpResult = (result: unknown, maxLength = 20000): string => {
  if (typeof result === 'string') return result.slice(0, maxLength)
  if (result === undefined) return 'The tool completed without a return value.'

  try {
    return JSON.stringify(result).slice(0, maxLength)
  } catch {
    return String(result).slice(0, maxLength)
  }
}

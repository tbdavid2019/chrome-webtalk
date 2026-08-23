import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, RefreshCwIcon, WrenchIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getWebMcpTools, isWebMcpAvailable, subscribeWebMcpToolChanges, type WebMcpTool } from '@/utils'
import { cn } from '@/utils'

type WebMcpPanelStatus = 'loading' | 'unsupported' | 'ready'

interface WebMcpPanelState {
  status: WebMcpPanelStatus
  tools: WebMcpTool[]
}

const getToolAnnotations = (tool: WebMcpTool): string[] => {
  const annotations = tool.annotations ?? {}
  const labels: string[] = []

  if (annotations.readOnlyHint === true) labels.push('唯讀 / Read-only')
  if (annotations.readOnlyHint === false) labels.push('可修改 / Can modify')
  if (annotations.destructiveHint === true) labels.push('具破壞性 / Destructive')
  if (annotations.untrustedContentHint === true) labels.push('含不受信內容 / Untrusted content')

  return labels.length ? labels : ['未提供安全標註 / No safety annotations']
}

const formatInputSchema = (schema: WebMcpTool['inputSchema']): string => {
  if (!schema) return '無輸入 schema / No input schema'
  if (typeof schema !== 'string') return JSON.stringify(schema, null, 2)

  try {
    return JSON.stringify(JSON.parse(schema), null, 2)
  } catch {
    return schema
  }
}

export default function WebMcpToolsPanel() {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState<WebMcpPanelState>({ status: 'loading', tools: [] })

  const refresh = useCallback(async () => {
    if (!isWebMcpAvailable()) {
      setState({ status: 'unsupported', tools: [] })
      return
    }

    setState((previous) => ({ ...previous, status: 'loading' }))
    const registry = await getWebMcpTools()
    setState({
      status: 'ready',
      tools: [...registry.handles.values()].map(({ tool }) => tool)
    })
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!active) return
      await refresh()
    }

    void load()
    const unsubscribe = subscribeWebMcpToolChanges(() => {
      void load()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [refresh])

  const statusLabel =
    state.status === 'loading'
      ? '探索中 / Discovering...'
      : state.tools.length
        ? `已支援 · ${state.tools.length} 個工具 / ${state.tools.length} tools`
        : '已支援 · 尚未提供工具 / No tools provided'

  // Unsupported pages should behave as if WebMCP is not present.
  if (state.status === 'unsupported' || (state.status === 'loading' && state.tools.length === 0)) return null

  return (
    <section className="mt-1 shrink-0 rounded-lg border border-border/50 bg-muted/20" aria-label="WebMCP tools">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          <div className="truncate text-[0.78em] text-muted-foreground" aria-live="polite">
            WebMCP · {statusLabel}
          </div>
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
          title="重新探索 WebMCP 工具 / Refresh WebMCP tools"
          aria-label="重新探索 WebMCP 工具 / Refresh WebMCP tools"
        >
          <RefreshCwIcon className={cn('size-3', state.status === 'loading' && 'animate-spin')} aria-hidden="true" />
        </button>
        <ChevronDown
          className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </div>

      {expanded && (
        <div className="border-t border-border/70 px-3 pb-3 pt-2">
          {state.status === 'loading' && (
            <p className="text-[0.9em] text-muted-foreground">正在讀取目前分頁的工具清單... / Loading page tools...</p>
          )}

          {state.status === 'ready' && state.tools.length === 0 && (
            <p className="text-[0.9em] leading-[1.6] text-muted-foreground">
              頁面支援 WebMCP，但目前沒有提供工具。
              <br />
              WebMCP is available, but this page provides no tools.
            </p>
          )}

          {state.status === 'ready' && state.tools.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {state.tools.map((tool) => (
                <article
                  key={`${tool.origin ?? 'current'}:${tool.name}`}
                  className="rounded-lg border border-border/70 bg-background p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="break-all text-[0.9em] font-semibold text-foreground">
                        {tool.title || tool.name}
                      </div>
                      {tool.title && (
                        <div className="break-all font-mono text-[0.72em] text-muted-foreground">{tool.name}</div>
                      )}
                    </div>
                    {tool.origin && (
                      <span className="max-w-[45%] truncate text-[0.72em] text-muted-foreground">{tool.origin}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[0.9em] leading-[1.6] text-muted-foreground">
                    {tool.description || '未提供用途描述 / No description provided'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getToolAnnotations(tool).map((label) => (
                      <Badge key={label} variant="outline" className="px-1.5 py-0 text-[0.72em] font-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[0.8em] font-medium text-primary">
                      輸入 schema / Input schema
                    </summary>
                    <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/60 p-2 font-mono text-[0.72em] leading-[1.5] text-muted-foreground">
                      {formatInputSchema(tool.inputSchema)}
                    </pre>
                  </details>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

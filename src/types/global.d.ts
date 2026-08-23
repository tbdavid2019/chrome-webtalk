declare type SafeAny = any

declare type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }

interface Document {
  /** Experimental WebMCP API exposed by newer Chrome versions. */
  modelContext?: import('@/utils/webmcp').WebMcpModelContext
}

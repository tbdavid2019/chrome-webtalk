import stringToHex from './stringToHex.ts'

export type RoomScope = 'meta' | 'origin' | 'path'

export interface RoomLocationLike {
  origin: string
  pathname: string
  host?: string
}

export interface RoomDocumentLike {
  querySelector: (selector: string) => { getAttribute: (name: string) => string | null } | null
}

export interface RoomIdentityOptions {
  /** Final room key override. It takes precedence over all other options. */
  roomId?: string
  /** `meta` reads the page id, `origin` shares one room per site, `path` uses pathname. */
  scope?: RoomScope
  /** Explicit page id from the embedder or the site's server-rendered metadata. */
  pageId?: string
  /** Stable namespace when several sites share the same signaling service. */
  siteId?: string
  /** Metadata name used when scope is `meta`. */
  metaName?: string
  location?: RoomLocationLike
  document?: RoomDocumentLike
}

const DEFAULT_META_NAME = 'webtalk-page-id'
const DEFAULT_SCOPE: RoomScope = 'meta'

export class MissingWebTalkPageIdError extends Error {
  constructor(metaName: string) {
    super(`A WebTalk page id is required for scope "meta". Add meta[name="${metaName}"] or use scope "origin".`)
    this.name = 'MissingWebTalkPageIdError'
  }
}

const requireLocation = (location?: RoomLocationLike): RoomLocationLike => {
  if (location) return location

  if (typeof window !== 'undefined') {
    return window.location
  }

  throw new Error('A location is required to resolve a WebTalk room.')
}

const normalizeValue = (value: string | undefined | null): string => value?.trim() ?? ''

const normalizePath = (pathname: string): string => {
  const normalized = pathname
    .trim()
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '')
  return normalized || '/'
}

const getGlobalDocument = (): RoomDocumentLike | undefined => {
  return typeof document !== 'undefined' ? document : undefined
}

const readPageId = (options: RoomIdentityOptions, document?: RoomDocumentLike): string => {
  const explicitPageId = normalizeValue(options.pageId)
  if (explicitPageId) return explicitPageId

  const metaName = normalizeValue(options.metaName) || DEFAULT_META_NAME
  const meta = document?.querySelector(`meta[name="${metaName}" i]`)
  return normalizeValue(meta?.getAttribute('content'))
}

export const resolvePageId = (options: RoomIdentityOptions = {}): string => {
  return readPageId(options, options.document ?? getGlobalDocument())
}

export const resolveRoomKey = (options: RoomIdentityOptions = {}): string => {
  const location = requireLocation(options.location)
  const siteId = normalizeValue(options.siteId) || location.origin
  const scope = options.scope ?? DEFAULT_SCOPE

  if (scope === 'origin') {
    return `origin:${siteId}`
  }

  if (scope === 'path') {
    const pageId = normalizeValue(options.pageId)
    return `path:${siteId}:${pageId || normalizePath(location.pathname)}`
  }

  const pageId = resolvePageId(options)
  if (!pageId) {
    throw new MissingWebTalkPageIdError(normalizeValue(options.metaName) || DEFAULT_META_NAME)
  }

  return `page:${siteId}:${pageId}`
}

export const resolveRoomId = (options: RoomIdentityOptions = {}): string => {
  const explicitRoomId = normalizeValue(options.roomId)
  return stringToHex(explicitRoomId || resolveRoomKey(options))
}

export const WEBTALK_DEFAULT_META_NAME = DEFAULT_META_NAME

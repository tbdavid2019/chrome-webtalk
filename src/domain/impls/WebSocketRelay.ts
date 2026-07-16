export interface MessageRelay {
  connect: () => void
  close: () => void
  send: (message: string) => void
  onMessage: (callback: (message: string) => void) => void
  onError: (callback: (error: Error) => void) => void
}

interface RelaySocket {
  readonly readyState: number
  send: (message: string) => void
  close: () => void
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent<string>) => void) | null
  onerror: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
}

type RelaySocketFactory = (url: string) => RelaySocket

const SOCKET_OPEN = 1
const SOCKET_CONNECTING = 0
const MAX_RECONNECT_DELAY_MS = 30_000
const MAX_PENDING_MESSAGES = 1_000

export const createRelayUrl = (endpoint: string, roomId: string, peerId: string): string => {
  const url = new URL(endpoint)
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:'
  url.searchParams.set('roomId', roomId)
  url.searchParams.set('peerId', peerId)
  return url.toString()
}

export class WebSocketRelay implements MessageRelay {
  private readonly url: string
  private readonly createSocket: RelaySocketFactory
  private readonly messageCallbacks = new Set<(message: string) => void>()
  private readonly errorCallbacks = new Set<(error: Error) => void>()
  private readonly pendingMessages: string[] = []
  private socket?: RelaySocket
  private reconnectTimer?: ReturnType<typeof setTimeout>
  private reconnectDelayMs = 1_000
  private manuallyClosed = false

  constructor({
    endpoint,
    roomId,
    peerId,
    createSocket = (url) => new WebSocket(url)
  }: {
    endpoint: string
    roomId: string
    peerId: string
    createSocket?: RelaySocketFactory
  }) {
    this.url = createRelayUrl(endpoint, roomId, peerId)
    this.createSocket = createSocket
  }

  connect(): void {
    this.manuallyClosed = false
    if (this.socket?.readyState === SOCKET_OPEN || this.socket?.readyState === SOCKET_CONNECTING) return

    const socket = this.createSocket(this.url)
    this.socket = socket
    socket.onopen = () => {
      this.reconnectDelayMs = 1_000
      this.flushPendingMessages()
    }
    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        this.messageCallbacks.forEach((callback) => callback(event.data))
      }
    }
    socket.onerror = () => {
      this.errorCallbacks.forEach((callback) => callback(new Error('WebTalk realtime relay connection failed.')))
    }
    socket.onclose = () => {
      if (this.socket === socket) this.socket = undefined
      if (!this.manuallyClosed) this.scheduleReconnect()
    }
  }

  send(message: string): void {
    if (this.socket?.readyState === SOCKET_OPEN) {
      this.socket.send(message)
      return
    }

    this.pendingMessages.push(message)
    if (this.pendingMessages.length > MAX_PENDING_MESSAGES) this.pendingMessages.shift()
    this.connect()
  }

  onMessage(callback: (message: string) => void): void {
    this.messageCallbacks.add(callback)
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.add(callback)
  }

  close(): void {
    this.manuallyClosed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
    this.socket?.close()
    this.socket = undefined
  }

  private flushPendingMessages(): void {
    while (this.socket?.readyState === SOCKET_OPEN && this.pendingMessages.length > 0) {
      this.socket.send(this.pendingMessages.shift()!)
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, this.reconnectDelayMs)
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS)
  }
}

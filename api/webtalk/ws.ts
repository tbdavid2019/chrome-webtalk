import { createHash, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import express from 'express'
import { Redis } from 'ioredis'
import { WebSocket, WebSocketServer, type RawData } from 'ws'

const MAX_MESSAGE_BYTES = 256 * 1024
const MAX_HISTORY_MESSAGES = 500
const HISTORY_TTL_SECONDS = 30 * 24 * 60 * 60
const REDIS_CHANNEL = 'webtalk:room-events:v1'
const instanceId = randomUUID()

interface ConnectionInfo {
  roomId: string
  connectionId: string
}

interface RelayEvent {
  eventId: string
  instanceId: string
  roomId: string
  payload: string
}

const sockets = new Map<WebSocket, ConnectionInfo>()
const redisUrl = process.env.REDIS_URL?.trim()
const redis = redisUrl ? new Redis(redisUrl, { maxRetriesPerRequest: 2, enableReadyCheck: true }) : null
const subscriber = redis?.duplicate() ?? null

const historyKey = (roomId: string): string =>
  `webtalk:room-history:${createHash('sha256').update(roomId).digest('hex')}`

const broadcastLocal = (roomId: string, payload: string, excluded?: WebSocket): void => {
  sockets.forEach((info, socket) => {
    if (socket !== excluded && info.roomId === roomId && socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    }
  })
}

if (subscriber) {
  subscriber.on('message', (_channel, rawEvent) => {
    try {
      const event = JSON.parse(rawEvent) as RelayEvent
      if (event.instanceId !== instanceId && event.roomId && typeof event.payload === 'string') {
        broadcastLocal(event.roomId, event.payload)
      }
    } catch (error) {
      console.error('[WebTalk Relay] Invalid Redis event', error)
    }
  })
  void subscriber.subscribe(REDIS_CHANNEL)
}

const persistAndPublish = async (roomId: string, payload: string): Promise<void> => {
  if (!redis) {
    console.error('[WebTalk Relay] REDIS_URL is missing; cross-instance delivery is unavailable.')
    return
  }

  const event: RelayEvent = {
    eventId: randomUUID(),
    instanceId,
    roomId,
    payload
  }
  const key = historyKey(roomId)
  await redis
    .multi()
    .rpush(key, payload)
    .ltrim(key, -MAX_HISTORY_MESSAGES, -1)
    .expire(key, HISTORY_TTL_SECONDS)
    .publish(REDIS_CHANNEL, JSON.stringify(event))
    .exec()
}

const loadHistory = async (socket: WebSocket, roomId: string): Promise<void> => {
  if (!redis) return

  const messages = await redis.lrange(historyKey(roomId), 0, -1)
  for (const message of messages) {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.send(message)
  }
}

const app = express()
app.get('/api/webtalk/ws', (_request, response) => {
  response.status(426).json({
    error: 'WebSocket upgrade required',
    redisConfigured: Boolean(redisUrl)
  })
})

const server = createServer(app)
const webSocketServer = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_BYTES })

webSocketServer.on('connection', (socket, request) => {
  const url = new URL(request.url ?? '/', 'https://webtalk.invalid')
  const roomId = url.searchParams.get('roomId')?.trim() ?? ''
  if (!roomId || roomId.length > 512) {
    socket.close(1008, 'Invalid room id')
    return
  }

  sockets.set(socket, { roomId, connectionId: randomUUID() })
  void loadHistory(socket, roomId).catch((error) => {
    console.error('[WebTalk Relay] Failed to load history', error)
  })

  socket.on('message', (data: RawData, isBinary: boolean) => {
    if (isBinary) {
      socket.close(1003, 'Text messages only')
      return
    }

    const payload = data.toString()
    if (Buffer.byteLength(payload, 'utf8') > MAX_MESSAGE_BYTES) {
      socket.close(1009, 'Message too large')
      return
    }

    broadcastLocal(roomId, payload, socket)
    void persistAndPublish(roomId, payload).catch((error) => {
      console.error('[WebTalk Relay] Failed to publish message', error)
    })
  })

  socket.on('close', () => sockets.delete(socket))
  socket.on('error', () => sockets.delete(socket))
})

export default server

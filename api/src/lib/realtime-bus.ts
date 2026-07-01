import { EventEmitter } from 'node:events'
import Redis from 'ioredis'
import { isRedisConfigured, isRedisConnected } from './redis.js'

export const REALTIME_REDIS_CHANNEL = 'imes:realtime:v1'
export const OPS_TODO_CHANNEL = 'ops:todo'

export type DocumentScope = 'inbound' | 'outbound'

export type DocumentRealtimePayload = {
  scope: DocumentScope
  documentId: string
  action: string
  at: string
  actorId?: string
  actorName?: string | null
}

export type OpsTodoRealtimePayload = {
  scope: DocumentScope
  documentId: string
  action: string
  at: string
}

type BusMessage = {
  channel: string
  payload: unknown
}

const local = new EventEmitter()
local.setMaxListeners(200)

let subscriber: Redis | null = null
let subscriberReady = false

export function documentChannel(scope: DocumentScope, documentId: string) {
  return `doc:${scope}:${documentId}`
}

function createAsyncIterator<T>(channel: string): AsyncIterableIterator<T> {
  const queue: T[] = []
  const pending: Array<(result: IteratorResult<T>) => void> = []
  let closed = false

  const onMessage = (payload: T) => {
    const resolve = pending.shift()
    if (resolve) resolve({ value: payload, done: false })
    else queue.push(payload)
  }

  local.on(channel, onMessage)

  const iterator: AsyncIterableIterator<T> = {
    [Symbol.asyncIterator]() {
      return this
    },
    next() {
      if (queue.length) return Promise.resolve({ value: queue.shift()!, done: false as const })
      if (closed) return Promise.resolve({ value: undefined, done: true as const })
      return new Promise((resolve) => pending.push(resolve))
    },
    return() {
      closed = true
      local.off(channel, onMessage)
      return Promise.resolve({ value: undefined, done: true as const })
    },
    throw(err) {
      closed = true
      local.off(channel, onMessage)
      return Promise.reject(err)
    },
  }

  return iterator
}

function dispatchLocal(channel: string, payload: unknown) {
  local.emit(channel, payload)
}

export function subscribeRealtime<T>(channel: string): AsyncIterableIterator<T> {
  return createAsyncIterator<T>(channel)
}

export async function publishRealtime(channel: string, payload: unknown): Promise<void> {
  dispatchLocal(channel, payload)

  if (!isRedisConnected()) return
  const { getRedis } = await import('./redis.js')
  const redis = getRedis()
  if (!redis) return

  const message: BusMessage = { channel, payload }
  try {
    await redis.publish(REALTIME_REDIS_CHANNEL, JSON.stringify(message))
  } catch (err) {
    console.warn('[realtime] redis publish failed:', (err as Error).message)
  }
}

export async function startRealtimeBus(): Promise<void> {
  if (!isRedisConfigured() || subscriberReady) return
  const url = process.env.REDIS_URL?.trim()
  if (!url) return

  subscriber = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 2_000,
    retryStrategy: () => null,
  })

  try {
    await subscriber.connect()
    await subscriber.subscribe(REALTIME_REDIS_CHANNEL)
    subscriber.on('message', (_, raw) => {
      try {
        const message = JSON.parse(raw) as BusMessage
        if (message?.channel) dispatchLocal(message.channel, message.payload)
      } catch {
        /* ignore malformed */
      }
    })
    subscriberReady = true
  } catch (err) {
    console.warn('[realtime] redis subscriber unavailable:', (err as Error).message)
    try {
      subscriber.disconnect()
    } catch {
      /* ignore */
    }
    subscriber = null
  }
}

export async function stopRealtimeBus(): Promise<void> {
  if (!subscriber) return
  try {
    await subscriber.unsubscribe(REALTIME_REDIS_CHANNEL)
    await subscriber.quit()
  } catch {
    subscriber.disconnect()
  } finally {
    subscriber = null
    subscriberReady = false
  }
}

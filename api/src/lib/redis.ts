import Redis from 'ioredis'

let client: Redis | null = null
/** 仅 connectRedis 成功后才为 true；未配置或连接失败时始终为 false */
let connected = false

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim())
}

/** 是否可安全使用 Redis 缓存 */
export function isRedisEnabled(): boolean {
  return connected
}

export function isRedisConnected(): boolean {
  return connected
}

function getOrCreateClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      retryStrategy: () => null,
    })
    client.on('error', () => {
      // 连接中断等运行时错误：静默降级，避免未捕获异常
      markRedisUnavailable()
    })
  }
  return client
}

/** 连接失败或缓存操作异常时调用，之后所有请求直接走数据库 */
export function markRedisUnavailable(reason?: unknown): void {
  if (!connected && !client) return
  connected = false
  if (reason !== undefined) {
    const msg = reason instanceof Error ? reason.message : String(reason)
    if (msg) console.warn('[redis] cache disabled:', msg)
  }
  if (client) {
    try {
      client.disconnect()
    } catch {
      /* ignore */
    }
    client = null
  }
}

export function getRedis(): Redis | null {
  if (!connected) return null
  return client
}

export async function connectRedis(): Promise<boolean> {
  if (!isRedisConfigured()) return false
  const redis = getOrCreateClient()
  if (!redis) return false
  try {
    if (redis.status !== 'ready') await redis.connect()
    await redis.ping()
    connected = true
    return true
  } catch (err) {
    markRedisUnavailable(err)
    return false
  }
}

export async function closeRedis(): Promise<void> {
  if (!client) return
  connected = false
  try {
    await client.quit()
  } catch {
    try {
      client.disconnect()
    } catch {
      /* ignore */
    }
  } finally {
    client = null
  }
}

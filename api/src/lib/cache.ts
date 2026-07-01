import { createHash } from 'node:crypto'
import { getRedis, isRedisEnabled, markRedisUnavailable } from './redis.js'

export const CACHE_PREFIX = 'imes:v1'

/** 主数据默认 TTL（秒）；变更时主动失效，TTL 仅作兜底 */
export const MASTER_DATA_TTL_SEC = 6 * 60 * 60

export function cacheKey(...parts: Array<string | number | boolean | null | undefined>): string {
  return parts
    .filter((part) => part !== undefined && part !== null && part !== '')
    .map((part) => String(part))
    .join(':')
}

export function cacheKeyHash(input: unknown): string {
  return createHash('sha1').update(JSON.stringify(input)).digest('hex').slice(0, 16)
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisEnabled()) return null
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (err) {
    markRedisUnavailable(err)
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSec = MASTER_DATA_TTL_SEC): Promise<void> {
  if (!isRedisEnabled()) return
  const redis = getRedis()
  if (!redis) return
  try {
    const payload = JSON.stringify(value)
    if (ttlSec > 0) {
      await redis.set(key, payload, 'EX', ttlSec)
    } else {
      await redis.set(key, payload)
    }
  } catch (err) {
    markRedisUnavailable(err)
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!keys.length || !isRedisEnabled()) return
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(...keys)
  } catch (err) {
    markRedisUnavailable(err)
  }
}

export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  if (!isRedisEnabled()) return
  const redis = getRedis()
  if (!redis) return

  const pattern = `${prefix}*`
  let cursor = '0'
  try {
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 128)
      cursor = next
      if (keys.length) await redis.del(...keys)
    } while (cursor !== '0')
  } catch (err) {
    markRedisUnavailable(err)
  }
}

/** cache-aside：Redis 未安装/未连接时直接走 loader，不影响业务 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSec = MASTER_DATA_TTL_SEC,
): Promise<T> {
  const hit = await cacheGet<T>(key)
  if (hit !== null) return hit
  const value = await loader()
  await cacheSet(key, value, ttlSec)
  return value
}

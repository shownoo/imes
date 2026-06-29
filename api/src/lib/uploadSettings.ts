import type { PrismaClient } from '@prisma/client'
import { COS_REGION } from './cosConfig.js'

export type UploadMode = 'auto' | 'cos' | 'qiniu' | 'oss' | 's3' | 'minio' | 'local' | 'off'

export const DEFAULT_MAX_IMAGE_MB = 2
export const DEFAULT_MAX_FILE_MB = 10

export type UploadSettingsRow = {
  uploadMode: UploadMode
  storageProvider: string
  storageBucket: string
  storageRegion: string
  storageAccessKey: string
  storageSecretKey: string
  storageEndpoint?: string
  cosAppId?: string
  cosSafeBucket?: string
  cosNormalBucket?: string
  maxImageMB: number
  maxFileMB: number
}

export type ResolvedCosConfig = {
  secretId: string
  secretKey: string
  appId: string
  normalBucket: string
  safeBucket: string
  normalBucketFull: string
  safeBucketFull: string
  region: string
}

export type ResolvedStorageConfig = {
  provider: 'cos' | 'qiniu' | 'oss' | 's3' | 'minio'
  accessKey: string
  secretKey: string
  bucket: string
  region: string
  endpoint?: string
}

const UPLOAD_KEYS = [
  'uploadMode',
  'storageProvider',
  'storageBucket',
  'storageRegion',
  'storageAccessKey',
  'storageSecretKey',
  'storageEndpoint',
  'cosAppId',
  'cosSafeBucket',
  'cosNormalBucket',
  'maxImageMB',
  'maxFileMB',
] as const

function clampMb(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function resolveUploadLimits(settings: {
  maxImageMB?: number | null
  maxFileMB?: number | null
}) {
  const maxImageMB = clampMb(settings.maxImageMB, DEFAULT_MAX_IMAGE_MB, 1, 50)
  const maxFileMB = Math.max(
    clampMb(settings.maxFileMB, DEFAULT_MAX_FILE_MB, 1, 100),
    maxImageMB,
  )
  return { maxImageMB, maxFileMB }
}

function parseSettingValue(value: unknown): unknown {
  if (value == null) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export function hasCosSecrets(): boolean {
  return Boolean(
    process.env.COS_SECRETID?.trim() && process.env.COS_SECRETKEY?.trim(),
  )
}

export async function loadUploadSettings(
  prisma: PrismaClient,
): Promise<UploadSettingsRow> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [...UPLOAD_KEYS] } },
  })
  const map = new Map<string, unknown>()
  for (const row of rows) {
    map.set(row.key, parseSettingValue(row.value))
  }

  const mode = String(map.get('uploadMode') || 'auto') as UploadMode
  const validModes: UploadMode[] = ['auto', 'cos', 'qiniu', 'oss', 's3', 'minio', 'local', 'off']
  return {
    uploadMode: validModes.includes(mode) ? mode : 'auto',
    storageProvider: String(map.get('storageProvider') || 'cos').trim(),
    storageBucket: String(map.get('storageBucket') || '').trim(),
    storageRegion: String(map.get('storageRegion') || '').trim(),
    storageAccessKey: String(map.get('storageAccessKey') || '').trim(),
    storageSecretKey: String(map.get('storageSecretKey') || '').trim(),
    storageEndpoint: String(map.get('storageEndpoint') || '').trim() || undefined,
    cosAppId: String(map.get('cosAppId') || '').trim() || undefined,
    cosSafeBucket: String(map.get('cosSafeBucket') || '').trim() || undefined,
    cosNormalBucket: String(map.get('cosNormalBucket') || '').trim() || undefined,
    maxImageMB: clampMb(map.get('maxImageMB'), DEFAULT_MAX_IMAGE_MB, 1, 50),
    maxFileMB: clampMb(map.get('maxFileMB'), DEFAULT_MAX_FILE_MB, 1, 100),
  }
}

export function resolveCosConfig(
  settings: UploadSettingsRow,
): ResolvedCosConfig | null {
  if (settings.storageProvider === 'cos' && settings.storageAccessKey && settings.storageSecretKey) {
    const appId = settings.storageAccessKey
    const bucket = settings.storageBucket
    if (!appId || !bucket) return null
    return {
      secretId: settings.storageAccessKey,
      secretKey: settings.storageSecretKey,
      appId,
      normalBucket: bucket,
      safeBucket: bucket,
      normalBucketFull: `${bucket}-${appId}`,
      safeBucketFull: `${bucket}-${appId}`,
      region: settings.storageRegion || COS_REGION,
    }
  }

  if (!hasCosSecrets()) return null

  const appId =
    settings.cosAppId || process.env.COS_APPID?.trim() || ''
  const safeBucket =
    settings.cosSafeBucket || process.env.COS_SAFE_BUCKET?.trim() || ''
  const normalBucket =
    settings.cosNormalBucket || process.env.COS_NORMAL_BUCKET?.trim() || ''

  if (!appId || !safeBucket || !normalBucket) return null

  return {
    secretId: process.env.COS_SECRETID!.trim(),
    secretKey: process.env.COS_SECRETKEY!.trim(),
    appId,
    normalBucket,
    safeBucket,
    safeBucketFull: `${safeBucket}-${appId}`,
    normalBucketFull: `${normalBucket}-${appId}`,
    region: COS_REGION,
  }
}

export function resolveStorageConfig(
  settings: UploadSettingsRow,
): ResolvedStorageConfig | null {
  const provider = settings.storageProvider as ResolvedStorageConfig['provider']

  if (!provider || settings.uploadMode === 'local' || settings.uploadMode === 'off') {
    return null
  }

  const accessKey = settings.storageAccessKey
  const secretKey = settings.storageSecretKey
  const bucket = settings.storageBucket
  const region = settings.storageRegion

  if (!accessKey || !secretKey || !bucket) {
    return null
  }

  return {
    provider,
    accessKey,
    secretKey,
    bucket,
    region: region || getDefaultRegion(provider),
    endpoint: settings.storageEndpoint,
  }
}

function getDefaultRegion(provider: ResolvedStorageConfig['provider']): string {
  switch (provider) {
    case 'cos':
      return COS_REGION
    case 'qiniu':
      return 'z0'
    case 'oss':
      return 'oss-cn-hangzhou'
    case 's3':
      return 'us-east-1'
    case 'minio':
      return 'us-east-1'
    default:
      return ''
  }
}

export function getAllowBuckets(cos: ResolvedCosConfig): string[] {
  return [cos.normalBucketFull, cos.safeBucketFull]
}

export function uploadStatusLabel(
  settings: UploadSettingsRow,
  cos: ResolvedCosConfig | null,
  provider: 'COS' | 'QINIU' | 'OSS' | 'S3' | 'MINIO' | 'LOCAL' | 'NONE',
): string {
  if (settings.uploadMode === 'off') {
    return '已关闭文件上传'
  }
  if (provider === 'COS') {
    return '当前可用：腾讯云 COS'
  }
  if (provider === 'QINIU') {
    return '当前可用：七牛云存储'
  }
  if (provider === 'OSS') {
    return '当前可用：阿里云 OSS'
  }
  if (provider === 'S3') {
    return '当前可用：AWS S3'
  }
  if (provider === 'MINIO') {
    return '当前可用：MinIO'
  }
  if (provider === 'LOCAL') {
    return '当前可用：本机存储'
  }
  if (['cos', 'qiniu', 'oss', 's3', 'minio', 'auto'].includes(settings.uploadMode)) {
    if (!settings.storageAccessKey || !settings.storageSecretKey) {
      return '未配置：请填写 AccessKey 和 SecretKey'
    }
    if (!settings.storageBucket) {
      return '未配置：请填写存储桶名称'
    }
  }
  return '文件上传未就绪'
}

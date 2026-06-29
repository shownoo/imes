import type { PrismaClient } from '@prisma/client'
import {
  loadUploadSettings,
  resolveCosConfig,
  resolveStorageConfig,
  resolveUploadLimits,
  uploadStatusLabel,
  type UploadMode,
} from './uploadSettings.js'

export type UploadProvider = 'COS' | 'QINIU' | 'OSS' | 'S3' | 'MINIO' | 'LOCAL' | 'NONE'

export type UploadCapabilityResult = {
  enabled: boolean
  provider: UploadProvider
  maxImageMB: number
  maxFileMB: number
  reason?: string | null
  cosBucket?: string | null
  cosRegion?: string | null
  storageBucket?: string | null
  storageRegion?: string | null
  canFallbackLocal?: boolean
}

function envLocalAllowed(): boolean {
  if (process.env.UPLOAD_LOCAL_ENABLED === 'false') return false
  if (process.env.UPLOAD_LOCAL_ENABLED === 'true') return true
  return true
}

function resolveProvider(
  mode: UploadMode,
  storage: ReturnType<typeof resolveStorageConfig>,
  cos: ReturnType<typeof resolveCosConfig>,
): UploadProvider {
  if (mode === 'off') return 'NONE'
  if (mode === 'local') return envLocalAllowed() ? 'LOCAL' : 'NONE'

  if (mode === 'cos') return cos ? 'COS' : (storage ? 'COS' : 'NONE')
  if (mode === 'qiniu') return storage ? 'QINIU' : 'NONE'
  if (mode === 'oss') return storage ? 'OSS' : 'NONE'
  if (mode === 's3') return storage ? 'S3' : 'NONE'
  if (mode === 'minio') return storage ? 'MINIO' : 'NONE'

  if (storage) {
    return storage.provider.toUpperCase() as UploadProvider
  }
  if (cos) return 'COS'
  if (envLocalAllowed()) return 'LOCAL'
  return 'NONE'
}

export async function getUploadCapability(
  prisma: PrismaClient,
): Promise<UploadCapabilityResult> {
  const settings = await loadUploadSettings(prisma)
  const { maxImageMB, maxFileMB } = resolveUploadLimits(settings)
  const storage = resolveStorageConfig(settings)
  const cos = resolveCosConfig(settings)
  const provider = resolveProvider(settings.uploadMode, storage, cos)

  if (provider === 'COS' && cos) {
    return {
      enabled: true,
      provider: 'COS',
      maxImageMB,
      maxFileMB,
      reason: null,
      cosBucket: cos.safeBucketFull,
      cosRegion: cos.region,
      canFallbackLocal:
        settings.uploadMode === 'auto' && envLocalAllowed(),
    }
  }

  if (provider === 'QINIU' && storage) {
    return {
      enabled: true,
      provider: 'QINIU',
      maxImageMB,
      maxFileMB,
      reason: null,
      storageBucket: storage.bucket,
      storageRegion: storage.region,
      canFallbackLocal:
        settings.uploadMode === 'auto' && envLocalAllowed(),
    }
  }

  if (provider === 'OSS' && storage) {
    return {
      enabled: true,
      provider: 'OSS',
      maxImageMB,
      maxFileMB,
      reason: null,
      storageBucket: storage.bucket,
      storageRegion: storage.region,
      canFallbackLocal:
        settings.uploadMode === 'auto' && envLocalAllowed(),
    }
  }

  if (provider === 'S3' && storage) {
    return {
      enabled: true,
      provider: 'S3',
      maxImageMB,
      maxFileMB,
      reason: null,
      storageBucket: storage.bucket,
      storageRegion: storage.region,
      canFallbackLocal:
        settings.uploadMode === 'auto' && envLocalAllowed(),
    }
  }

  if (provider === 'MINIO' && storage) {
    return {
      enabled: true,
      provider: 'MINIO',
      maxImageMB,
      maxFileMB,
      reason: null,
      storageBucket: storage.bucket,
      storageRegion: storage.region,
      canFallbackLocal:
        settings.uploadMode === 'auto' && envLocalAllowed(),
    }
  }

  if (provider === 'LOCAL') {
    return {
      enabled: true,
      provider: 'LOCAL',
      maxImageMB,
      maxFileMB,
      reason: null,
      cosBucket: null,
      cosRegion: null,
      canFallbackLocal: false,
    }
  }

  const reason =
    settings.uploadMode === 'off'
      ? 'disabled'
      : 'notConfigured'

  return {
    enabled: false,
    provider: 'NONE',
    maxImageMB,
    maxFileMB,
    reason,
    cosBucket: null,
    cosRegion: null,
  }
}

export function getLocalUploadDir(): string {
  return process.env.UPLOAD_LOCAL_DIR || 'uploads'
}

export function getFilePublicUrl(key: string, storageType: string): string {
  if (storageType === 'COS') return key
  const base =
    process.env.API_PUBLIC_URL ||
    `http://localhost:${Number(process.env.PORT) || 3200}`
  return `${base.replace(/\/$/, '')}/files/${encodeURIComponent(key)}`
}

export async function getUploadSettingsForAdmin(prisma: PrismaClient) {
  const settings = await loadUploadSettings(prisma)
  const limits = resolveUploadLimits(settings)
  const cos = resolveCosConfig(settings)
  const cap = await getUploadCapability(prisma)
  return {
    uploadMode: settings.uploadMode,
    storageProvider: settings.storageProvider,
    storageBucket: settings.storageBucket,
    storageRegion: settings.storageRegion,
    storageAccessKey: settings.storageAccessKey,
    storageSecretKey: settings.storageSecretKey,
    storageEndpoint: settings.storageEndpoint ?? '',
    cosAppId: settings.cosAppId || process.env.COS_APPID || '',
    cosSafeBucket: settings.cosSafeBucket || process.env.COS_SAFE_BUCKET || '',
    cosNormalBucket:
      settings.cosNormalBucket || process.env.COS_NORMAL_BUCKET || '',
    maxImageMB: limits.maxImageMB,
    maxFileMB: limits.maxFileMB,
    uploadSecretsConfigured: Boolean(
      process.env.COS_SECRETID?.trim() && process.env.COS_SECRETKEY?.trim(),
    ),
    uploadStatusText: uploadStatusLabel(settings, cos, cap.provider),
    uploadEnabled: cap.enabled,
    uploadProvider: cap.provider,
  }
}

export { hasCosSecrets, loadUploadSettings, resolveCosConfig } from './uploadSettings.js'

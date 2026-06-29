import type { PrismaClient } from '@prisma/client'
import {
  loadUploadSettings,
  resolveUploadLimits,
  type UploadMode,
  type UploadSettingsRow,
} from './uploadSettings.js'

export type UploadSettingsInput = {
  uploadMode: UploadMode
  storageProvider: string
  storageBucket: string
  storageRegion: string
  storageAccessKey: string
  storageSecretKey?: string
  storageEndpoint?: string
  cosAppId?: string
  cosSafeBucket?: string
  cosNormalBucket?: string
  maxImageMB: number
  maxFileMB: number
}

const PERSIST_KEYS = [
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

export async function saveUploadSettings(
  prisma: PrismaClient,
  input: UploadSettingsInput,
): Promise<void> {
  const entries: Record<string, string | number> = {
    uploadMode: input.uploadMode,
    storageProvider: input.storageProvider,
    storageBucket: input.storageBucket,
    storageRegion: input.storageRegion,
    storageAccessKey: input.storageAccessKey,
    storageEndpoint: input.storageEndpoint ?? '',
    cosAppId: input.cosAppId ?? '',
    cosSafeBucket: input.cosSafeBucket ?? '',
    cosNormalBucket: input.cosNormalBucket ?? '',
    ...resolveUploadLimits(input),
  }

  if (input.storageSecretKey?.trim()) {
    entries.storageSecretKey = input.storageSecretKey.trim()
  }

  for (const key of PERSIST_KEYS) {
    if (key === 'storageSecretKey' && !entries.storageSecretKey) continue
    const value = entries[key]
    if (value === undefined) continue
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: value as never, type: 'json' },
      update: { value: value as never },
    })
  }
}

export function toUploadSettingsInput(row: UploadSettingsRow): UploadSettingsInput {
  const limits = resolveUploadLimits(row)
  return {
    uploadMode: row.uploadMode,
    storageProvider: row.storageProvider,
    storageBucket: row.storageBucket,
    storageRegion: row.storageRegion,
    storageAccessKey: row.storageAccessKey,
    storageSecretKey: row.storageSecretKey,
    storageEndpoint: row.storageEndpoint ?? '',
    cosAppId: row.cosAppId ?? '',
    cosSafeBucket: row.cosSafeBucket ?? '',
    cosNormalBucket: row.cosNormalBucket ?? '',
    ...limits,
  }
}

import { builder } from '../builder.js'
import { saveUploadSettings, type UploadSettingsInput } from '../lib/upload-config.js'
import { getUploadSettingsForAdmin } from '../lib/uploadCapability.js'
import { resolveUploadLimits, type UploadMode } from '../lib/uploadSettings.js'

const SaveUploadSettingsInput = builder.inputType('SaveUploadSettingsInput', {
  fields: (t) => ({
    uploadMode: t.string({ required: true }),
    storageProvider: t.string({ required: true }),
    storageBucket: t.string({ required: false }),
    storageRegion: t.string({ required: false }),
    storageAccessKey: t.string({ required: false }),
    storageSecretKey: t.string({ required: false }),
    storageEndpoint: t.string({ required: false }),
    cosAppId: t.string({ required: false }),
    cosSafeBucket: t.string({ required: false }),
    cosNormalBucket: t.string({ required: false }),
    maxImageMB: t.float({ required: false }),
    maxFileMB: t.float({ required: false }),
  }),
})

const validModes: UploadMode[] = ['auto', 'cos', 'qiniu', 'oss', 's3', 'minio', 'local', 'off']

function normalizeInput(raw: {
  uploadMode: string
  storageProvider: string
  storageBucket?: string | null
  storageRegion?: string | null
  storageAccessKey?: string | null
  storageSecretKey?: string | null
  storageEndpoint?: string | null
  cosAppId?: string | null
  cosSafeBucket?: string | null
  cosNormalBucket?: string | null
  maxImageMB?: number | null
  maxFileMB?: number | null
}): UploadSettingsInput {
  const mode = String(raw.uploadMode || 'auto') as UploadMode
  const limits = resolveUploadLimits({
    maxImageMB: raw.maxImageMB,
    maxFileMB: raw.maxFileMB,
  })
  return {
    uploadMode: validModes.includes(mode) ? mode : 'auto',
    storageProvider: String(raw.storageProvider || 'cos').trim(),
    storageBucket: String(raw.storageBucket || '').trim(),
    storageRegion: String(raw.storageRegion || '').trim(),
    storageAccessKey: String(raw.storageAccessKey || '').trim(),
    storageSecretKey: raw.storageSecretKey?.trim() || undefined,
    storageEndpoint: String(raw.storageEndpoint || '').trim(),
    cosAppId: String(raw.cosAppId || '').trim(),
    cosSafeBucket: String(raw.cosSafeBucket || '').trim(),
    cosNormalBucket: String(raw.cosNormalBucket || '').trim(),
    ...limits,
  }
}

builder.queryField('getUploadSettings', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    resolve: async (_, __, ctx) => getUploadSettingsForAdmin(ctx.prisma),
  }),
)

builder.mutationField('saveUploadSettings', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { admin: true },
    args: { input: t.arg({ type: SaveUploadSettingsInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      const normalized = normalizeInput(input)
      await saveUploadSettings(ctx.prisma, normalized)
      return getUploadSettingsForAdmin(ctx.prisma)
    },
  }),
)

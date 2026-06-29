import { builder } from '../builder.js'
import { getUploadCapability } from '../lib/uploadCapability.js'

const UploadProviderEnum = builder.enumType('UploadProvider', {
  values: ['COS', 'QINIU', 'OSS', 'S3', 'MINIO', 'LOCAL', 'NONE'] as const,
})

const UploadCapabilityType = builder.objectRef<{
  enabled: boolean
  provider: 'COS' | 'QINIU' | 'OSS' | 'S3' | 'MINIO' | 'LOCAL' | 'NONE'
  maxImageMB: number
  maxFileMB: number
  reason?: string | null
  cosBucket?: string | null
  cosRegion?: string | null
  storageBucket?: string | null
  storageRegion?: string | null
  canFallbackLocal?: boolean
}>('UploadCapability').implement({
  fields: (t) => ({
    enabled: t.exposeBoolean('enabled'),
    provider: t.field({
      type: UploadProviderEnum,
      resolve: (p) => p.provider,
    }),
    maxImageMB: t.exposeFloat('maxImageMB'),
    maxFileMB: t.exposeFloat('maxFileMB'),
    reason: t.exposeString('reason', { nullable: true }),
    cosBucket: t.exposeString('cosBucket', { nullable: true }),
    cosRegion: t.exposeString('cosRegion', { nullable: true }),
    storageBucket: t.exposeString('storageBucket', { nullable: true }),
    storageRegion: t.exposeString('storageRegion', { nullable: true }),
    canFallbackLocal: t.exposeBoolean('canFallbackLocal', { nullable: true }),
  }),
})

builder.queryField('uploadCapability', (t) =>
  t.field({
    type: UploadCapabilityType,
    authScopes: { authenticated: true },
    resolve: async (_, _args, ctx) => getUploadCapability(ctx.prisma),
  }),
)

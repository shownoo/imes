import { builder } from '../builder.js'
import STS from 'qcloud-cos-sts'
import { difference, isEmpty } from 'ramda'
import { COS_REGION } from '../lib/cosConfig.js'
import {
  getAllowBuckets,
  hasCosSecrets,
  loadUploadSettings,
  resolveCosConfig,
} from '../lib/uploadSettings.js'

const COS_LOCATION = COS_REGION
const FILE_PREFIX = { resource: 'resourceFile', avatar: 'avatar' }

const ALLOW_ACTIONS = [
  'name/cos:PutObject',
  'name/cos:PostObject',
  'name/cos:InitiateMultipartUpload',
  'name/cos:ListMultipartUploads',
  'name/cos:ListParts',
  'name/cos:UploadPart',
  'name/cos:CompleteMultipartUpload',
]

function checkAction(action: unknown) {
  if (typeof action === 'string') return ALLOW_ACTIONS.includes(action)
  return isEmpty(difference(action as string[], ALLOW_ACTIONS))
}

function allowScope(scope: unknown[], allowBuckets: string[]) {
  return (scope || []).every((item) => {
    const row = item as { action: unknown; bucket: string; region: string; prefix?: string }
    const legalAction = checkAction(row.action)
    const legalBucket = allowBuckets.includes(row.bucket)
    const legalRegion = row.region === COS_LOCATION
    const legalPrefix =
      (row.prefix || '').startsWith(FILE_PREFIX.resource) ||
      (row.prefix || '').startsWith(FILE_PREFIX.avatar)
    return legalAction && legalBucket && legalRegion && legalPrefix
  })
}

function promiseCredential(policy: object, secretId: string, secretKey: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    STS.getCredential(
      {
        secretId,
        secretKey,
        proxy: '',
        durationSeconds: 1800,
        policy,
      },
      (err: any, tempKeys: any) => {
        if (err) reject(err)
        else resolve(tempKeys)
      },
    )
  })
}

const ScopeObjInput = builder.inputType('ScopeObjInput', {
  fields: (t) => ({
    action: t.string({ required: true }),
    bucket: t.string({ required: true }),
    region: t.string({ required: true }),
    prefix: t.string({ required: true }),
  }),
})

const GetCosTokenInput = builder.inputType('GetCosTokenInput', {
  fields: (t) => ({
    scope: t.field({ type: [ScopeObjInput], required: true }),
  }),
})

builder.queryField('getCosToken', (t) =>
  t.field({
    type: 'JSON',
    authScopes: { authenticated: true },
    args: { input: t.arg({ type: GetCosTokenInput, required: true }) },
    resolve: async (_, { input }, ctx) => {
      if (!hasCosSecrets()) {
        throw new Error('cos.notConfigured')
      }
      const settings = await loadUploadSettings(ctx.prisma)
      const cos = resolveCosConfig(settings)
      if (!cos) {
        throw new Error('cos.notConfigured')
      }
      const scope = input.scope as unknown as Parameters<typeof STS.getPolicy>[0]
      const allowBuckets = getAllowBuckets(cos)
      if (!scope?.length || !allowScope(scope as unknown[], allowBuckets)) {
        throw new Error('cos.illegalScope')
      }
      const policy = STS.getPolicy(scope)
      try {
        return await promiseCredential(policy, cos.secretId, cos.secretKey)
      } catch (e) {
        throw new Error(`cos.illegalCredential: ${e}`)
      }
    },
  }),
)

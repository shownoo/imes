import { gql, useQuery } from '@apollo/client'

export type UploadProviderKind =
  | 'COS'
  | 'QINIU'
  | 'OSS'
  | 'S3'
  | 'MINIO'
  | 'LOCAL'
  | 'NONE'

const UploadCapabilityDocument = gql`
  query UploadCapability {
    uploadCapability {
      enabled
      provider
      maxImageMB
      maxFileMB
      reason
      cosBucket
      cosRegion
      storageBucket
      storageRegion
      canFallbackLocal
    }
  }
`

type UploadCapabilityQuery = {
  uploadCapability?: {
    enabled: boolean
    provider: UploadProviderKind
    maxImageMB: number
    maxFileMB: number
    reason?: string | null
    cosBucket?: string | null
    cosRegion?: string | null
    storageBucket?: string | null
    storageRegion?: string | null
    canFallbackLocal?: boolean | null
  }
}

export function useUploadCapability() {
  const { data, loading, error } = useQuery<UploadCapabilityQuery>(
    UploadCapabilityDocument,
    { fetchPolicy: 'cache-and-network' },
  )

  const cap = data?.uploadCapability

  return {
    loading,
    error,
    enabled: cap?.enabled ?? false,
    provider: (cap?.provider ?? 'NONE') as UploadProviderKind,
    maxImageMB: cap?.maxImageMB ?? 2,
    maxFileMB: cap?.maxFileMB ?? 10,
    reason: cap?.reason ?? null,
    cosBucket: cap?.cosBucket ?? null,
    cosRegion: cap?.cosRegion ?? null,
    storageBucket: cap?.storageBucket ?? null,
    storageRegion: cap?.storageRegion ?? null,
    canFallbackLocal: cap?.canFallbackLocal ?? false,
  }
}

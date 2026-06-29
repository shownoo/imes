import { gql } from '@apollo/client'

export const GET_UPLOAD_SETTINGS = gql`
  query GetUploadSettings {
    getUploadSettings
  }
`

export const SAVE_UPLOAD_SETTINGS = gql`
  mutation SaveUploadSettings($input: SaveUploadSettingsInput!) {
    saveUploadSettings(input: $input)
  }
`

export type UploadMode =
  | 'auto'
  | 'cos'
  | 'qiniu'
  | 'oss'
  | 's3'
  | 'minio'
  | 'local'
  | 'off'

export type UploadSettings = {
  uploadMode: UploadMode
  storageProvider: string
  storageBucket: string
  storageRegion: string
  storageAccessKey: string
  storageSecretKey: string
  storageEndpoint: string
  cosAppId: string
  cosSafeBucket: string
  cosNormalBucket: string
  maxImageMB: number
  maxFileMB: number
  uploadSecretsConfigured: boolean
  uploadStatusText: string
  uploadEnabled: boolean
  uploadProvider: string
}

export const UPLOAD_MODE_OPTIONS: { value: UploadMode; label: string; desc?: string }[] = [
  { value: 'auto', label: '自动（推荐）', desc: '优先云存储，未配置时回退本机' },
  { value: 'local', label: '本机存储', desc: '文件保存在服务器 uploads 目录' },
  { value: 'cos', label: '腾讯云 COS' },
  { value: 'qiniu', label: '七牛云' },
  { value: 'oss', label: '阿里云 OSS' },
  { value: 's3', label: 'AWS S3' },
  { value: 'minio', label: 'MinIO' },
  { value: 'off', label: '关闭上传' },
]

export const STORAGE_PROVIDER_OPTIONS = [
  { value: 'cos', label: '腾讯云 COS' },
  { value: 'qiniu', label: '七牛云' },
  { value: 'oss', label: '阿里云 OSS' },
  { value: 's3', label: 'AWS S3' },
  { value: 'minio', label: 'MinIO' },
]

export const defaultUploadSettings = (): UploadSettings => ({
  uploadMode: 'auto',
  storageProvider: 'cos',
  storageBucket: '',
  storageRegion: '',
  storageAccessKey: '',
  storageSecretKey: '',
  storageEndpoint: '',
  cosAppId: '',
  cosSafeBucket: '',
  cosNormalBucket: '',
  maxImageMB: 2,
  maxFileMB: 10,
  uploadSecretsConfigured: false,
  uploadStatusText: '',
  uploadEnabled: true,
  uploadProvider: 'LOCAL',
})

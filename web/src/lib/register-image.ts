import { getApiBaseUrl } from 'lib/api-base'
import { formatApiError } from 'lib/api-error'
import { uploadFileLocal } from 'lib/upload'

export type RegisteredImage = {
  id: string
  url: string
  name: string
}

const REGISTER_FILE_MUTATION = `
mutation RegisterFile($input: RegisterFileInput!) {
  registerFile(input: $input) {
    id
    name
    url
    mimeType
  }
}
`

export async function uploadAndRegisterImage(file: File): Promise<RegisteredImage> {
  const uploaded = await uploadFileLocal(file)
  const token = localStorage.getItem('imes_token')
  const graphqlUrl = import.meta.env.VITE_API_URL || ''
  if (!graphqlUrl) {
    throw new Error(formatApiError('upload.noApiUrl'))
  }

  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: REGISTER_FILE_MUTATION,
      variables: {
        input: {
          name: file.name,
          md5: uploaded.md5,
          file: {
            key: uploaded.key,
            size: uploaded.size,
            storageType: uploaded.storageType,
            mime: uploaded.mime,
            area: 'NORMAL',
          },
        },
      },
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.errors?.length) {
    const msg = body.errors?.[0]?.message ?? 'register.failed'
    throw new Error(formatApiError(msg, '文件登记失败'))
  }

  const fileItem = body.data?.registerFile as RegisteredImage | undefined
  if (!fileItem?.id || !fileItem.url) {
    throw new Error(formatApiError('register.failed'))
  }

  return fileItem
}

export function isImageMime(mime?: string | null) {
  return Boolean(mime?.startsWith('image/'))
}

export function fileUrlFromKey(key: string) {
  const base = getApiBaseUrl()
  return base ? `${base}/files/${encodeURIComponent(key)}` : ''
}

import { getApiBaseUrl } from 'lib/api-base'

export type LocalUploadResult = {
  key: string
  mime: string
  size: number
  md5: string
  storageType: string
}

export async function uploadFileLocal(file: File): Promise<LocalUploadResult> {
  const token = localStorage.getItem('imes_token')
  const apiBase = getApiBaseUrl()
  if (!apiBase) {
    throw new Error('upload.noApiUrl')
  }

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${apiBase}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.error === 'string' ? body.error : 'upload.failed',
    )
  }

  return (await res.json()) as LocalUploadResult
}

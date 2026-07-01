import { translate } from 'locales'
export type DevicePreviewId = 'desktop' | 'mobile'

export const DEVICE_PREVIEW_STORAGE_PREFIX = 'imes-device-preview:'

export const MOBILE_EMBED_QUERY = 'embed'
export const MOBILE_EMBED_VALUE = 'mobile'

export const DEVICE_PREVIEW_OPTIONS: Array<{
  id: DevicePreviewId
  label: string
  desc: string
}> = [
  { id: 'desktop', label: translate('电脑端'), desc: translate('完整 Web 界面') },
  { id: 'mobile', label: translate('手机端'), desc: translate('模拟小程序仓管界面') },
]

export function devicePreviewStorageKey(userId: string): string {
  return `${DEVICE_PREVIEW_STORAGE_PREFIX}${userId}`
}

export function readStoredDevicePreview(userId: string): DevicePreviewId | null {
  try {
    const raw = localStorage.getItem(devicePreviewStorageKey(userId))
    if (raw === 'desktop' || raw === 'mobile') return raw
  } catch {
    /* ignore */
  }
  return null
}

export function saveDevicePreview(userId: string, preview: DevicePreviewId): void {
  try {
    localStorage.setItem(devicePreviewStorageKey(userId), preview)
  } catch {
    /* ignore */
  }
}

export function isMobilePreviewActive(preview: DevicePreviewId): boolean {
  return preview === 'mobile'
}

export function isMobileEmbedSearch(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search
  return new URLSearchParams(raw).get(MOBILE_EMBED_QUERY) === MOBILE_EMBED_VALUE
}

/** iframe 内加载的真实手机视口 URL（390px 宽，触发 sm/md 断点） */
export function buildMobileEmbedSrc(pathname: string, search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(raw)
  params.set(MOBILE_EMBED_QUERY, MOBILE_EMBED_VALUE)
  const q = params.toString()
  return `${pathname}?${q}`
}

export function isRunningInMobileEmbedFrame(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.parent !== window && isMobileEmbedSearch(window.location.search)
  } catch {
    return false
  }
}

import { useSearchParams } from 'react-router-dom'
import { MOBILE_EMBED_QUERY, MOBILE_EMBED_VALUE } from 'lib/device-preview'

/** 是否在手机预览 iframe 内运行（真实 390px 视口） */
export function useMobileEmbed(): boolean {
  const [params] = useSearchParams()
  return params.get(MOBILE_EMBED_QUERY) === MOBILE_EMBED_VALUE
}

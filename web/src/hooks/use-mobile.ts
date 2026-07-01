import { useContext } from 'react'
import { DevicePreviewContext } from 'contexts/device-preview-context'
import { useViewportMobile } from 'hooks/use-viewport-mobile'

/** shadcn/ui：<768px 视为移动端；开启「手机端」预览时同样按移动端布局 */
export function useIsMobile(): boolean {
  const previewCtx = useContext(DevicePreviewContext)
  const viewportMobile = useViewportMobile()
  return Boolean(previewCtx?.mobilePreview || viewportMobile)
}

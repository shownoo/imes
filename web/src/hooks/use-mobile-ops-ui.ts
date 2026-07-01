import { useDevicePreview } from 'contexts/device-preview-context'

/** 手机端仓管 UI（操作端 = 手机端 时启用，供小程序参考实现） */
export function useMobileOpsUi(): boolean {
  const { mobilePreview } = useDevicePreview()
  return mobilePreview
}

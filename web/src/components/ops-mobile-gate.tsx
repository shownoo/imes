import { Navigate, useLocation } from 'react-router-dom'
import { getStoredUser } from 'lib/apollo'
import { useMobileOpsUi } from 'hooks/use-mobile-ops-ui'
import { useWorkMode } from 'contexts/work-mode-context'
import { resolveDefaultLandingPath } from 'lib/mobile-ops'

/** 手机端专属路由：电脑端访问时重定向到桌面首页 */
export function OpsMobileGate({ children }: { children: React.ReactNode }) {
  const mobileOps = useMobileOpsUi()
  const { mode } = useWorkMode()
  const location = useLocation()
  const userId = getStoredUser()?.id ?? null

  if (!mobileOps) {
    const landing = resolveDefaultLandingPath(mode, userId)
    if (location.pathname !== landing) {
      return <Navigate to={landing} replace />
    }
  }

  return <>{children}</>
}

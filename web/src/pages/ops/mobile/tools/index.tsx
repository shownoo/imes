import { Navigate } from 'react-router-dom'
import { MOBILE_OPS_ME } from 'lib/mobile-ops'

/** 现场工具已扁平化至「我的」，保留路由兼容旧链接 */
export default function OpsMobileTools() {
  return <Navigate to={MOBILE_OPS_ME} replace />
}

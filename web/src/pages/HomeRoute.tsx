import { Navigate } from 'react-router-dom'
import { useMobileOpsUi } from 'hooks/use-mobile-ops-ui'
import { MOBILE_OPS_HOME } from 'lib/mobile-ops'
import Dashboard from './Dashboard'

export default function HomeRoute() {
  const mobileOps = useMobileOpsUi()
  if (mobileOps) return <Navigate to={MOBILE_OPS_HOME} replace />
  return <Dashboard />
}

import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { Package, ScanLine, Truck, User } from 'lucide-react'
import {
  MOBILE_OPS_HOME,
  MOBILE_OPS_ME,
  MOBILE_OPS_SCAN,
  MOBILE_OPS_SHIP,
  parseMobileTodoTab,
} from 'lib/mobile-ops'
import { useMobileOpsTaskCounts } from 'hooks/use-mobile-ops-task-counts'
import { cn } from 'lib/utils'

const OPS_NAV = [
  { id: 'receive' as const, to: MOBILE_OPS_HOME, icon: Package, label: '收货' },
  { id: 'ship' as const, to: MOBILE_OPS_SHIP, icon: Truck, label: '发货' },
  { id: 'scan' as const, to: MOBILE_OPS_SCAN, icon: ScanLine, label: '扫码' },
  { id: 'me' as const, to: MOBILE_OPS_ME, icon: User, label: '我的' },
]

function formatTabBadge(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function OpsMobileBottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const tab = parseMobileTodoTab(searchParams.get('tab'))
  const onHub = pathname === MOBILE_OPS_HOME
  const { receiveCount, shipCount, receiveOverdueCount, shipOverdueCount } = useMobileOpsTaskCounts()

  const counts: Record<string, number> = {
    receive: receiveCount,
    ship: shipCount,
  }

  const overdueCounts: Record<string, number> = {
    receive: receiveOverdueCount,
    ship: shipOverdueCount,
  }

  const overdueLabels: Record<string, string> = {
    receive: '含已过计划收货日',
    ship: '含已过计划发货日',
  }

  return (
    <nav
      className="mobile-ops-tabbar"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      {OPS_NAV.map(({ id, to, icon: Icon, label }) => {
        const active =
          id === 'receive'
            ? onHub && tab === 'receive'
            : id === 'ship'
              ? onHub && tab === 'ship'
              : id === 'scan'
                ? pathname.startsWith(MOBILE_OPS_SCAN)
                : pathname.startsWith(MOBILE_OPS_ME)

        const badge = counts[id] ?? 0
        const urgent = (overdueCounts[id] ?? 0) > 0
        const showBadge = badge > 0 && !active

        return (
          <NavLink
            key={id}
            to={to}
            end={id === 'receive'}
            className={cn('mobile-ops-tabbar-item', active && 'mobile-ops-tabbar-item--active')}
          >
            <span className="mobile-ops-tabbar-icon-wrap">
              <Icon className="size-[22px] shrink-0" strokeWidth={active ? 2.1 : 1.65} />
              {showBadge && (
                <span
                  className={cn(
                    'mobile-ops-tabbar-badge',
                    urgent ? 'mobile-ops-tabbar-badge--urgent' : 'mobile-ops-tabbar-badge--todo',
                  )}
                  aria-label={
                    urgent
                      ? `${badge} 项待处理，${overdueLabels[id] ?? '含逾期任务'}`
                      : `${badge} 项待处理`
                  }
                >
                  {formatTabBadge(badge)}
                </span>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

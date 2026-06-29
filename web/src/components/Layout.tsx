import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Bell,
  ScanLine,
  Shield,
  Settings,
} from 'lucide-react'
import { NotificationCenter } from 'components/notification-center'
import { UserMenu } from 'components/settings-menu'
import { AuthSession } from 'components/auth-session'
import { ApprovalInboxNavItem, ApprovalReminderBanner } from 'components/approval-inbox'
import { useApprovalDesktopNotify } from 'hooks/use-approval-desktop-notify'
import { useAuth } from 'lib/auth'
import { cn } from 'lib/utils'

const NAV = [
  { to: '/', icon: LayoutDashboard, labelKey: '工作台' },
  { to: '/materials', icon: Package, labelKey: '基础数据' },
  { to: '/warehouses', icon: Warehouse, labelKey: '库区货位' },
  { to: '/inbound', icon: ArrowDownToLine, labelKey: '采购入库' },
  { to: '/outbound', icon: ArrowUpFromLine, labelKey: '出库管理' },
  { to: '/inventory', icon: Boxes, labelKey: '库存盘点' },
  { to: '/alerts', icon: Bell, labelKey: '智能预警' },
  { to: '/trace', icon: ScanLine, labelKey: '扫码追溯' },
]

const ADMIN_NAV = [{ to: '/admin', icon: Settings, labelKey: '系统管理' }]

function navLinkClass(active: boolean) {
  return cn(
    'imes-header__nav-link',
    active ? 'imes-header__nav-link--active' : 'imes-header__nav-link--idle',
  )
}

export default function Layout() {
  const { t } = useTranslation()
  const location = useLocation()
  const { canManageSystem } = useAuth()
  useApprovalDesktopNotify()
  const navItems = canManageSystem ? [...NAV, ...ADMIN_NAV] : NAV

  return (
    <div className="flex min-h-screen flex-col" data-cheta-layout>
      <AuthSession />
      <header className="leader-nav imes-header sticky top-0 z-50 w-full border-b">
        <div className="imes-header__inner">
          <div className="imes-header__brand">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Shield className="size-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-display text-sm font-bold leading-none">IMES</p>
              <p className="text-[10px] text-muted-foreground">{t('应急物资智能管理')}</p>
            </div>
          </div>

          <nav className="imes-header__nav">
            {navItems.map(({ to, icon: Icon, labelKey }) => {
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
              const label = t(labelKey)
              return (
                <NavLink key={to} to={to} end={to === '/'} className={navLinkClass(active)} title={label}>
                  <Icon />
                  <span>{label}</span>
                </NavLink>
              )
            })}
            <ApprovalInboxNavItem className={navLinkClass(location.pathname.startsWith('/tasks'))} />
          </nav>

          <div className="imes-header__actions">
            <NotificationCenter />
            <UserMenu />
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full flex-1 py-6 lg:py-8"
        style={{ maxWidth: 'var(--leader-content-max, 1440px)', paddingLeft: 'var(--leader-content-padding, 24px)', paddingRight: 'var(--leader-content-padding, 24px)' }}
      >
        <ApprovalReminderBanner />
        <Outlet />
      </main>
    </div>
  )
}

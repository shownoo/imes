import type { ElementType } from 'react'
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
import { AppSidebar, type AppNavItem } from 'components/app-sidebar'
import { NotificationCenter } from 'components/notification-center'
import { UserMenu } from 'components/settings-menu'
import { WorkspacePageShell } from 'components/workspace-page-shell'
import { AuthSession } from 'components/auth-session'
import { ApprovalInboxNavItem, ApprovalReminderBanner } from 'components/approval-inbox'
import { useApprovalDesktopNotify } from 'hooks/use-approval-desktop-notify'
import { useAuth } from 'lib/auth'
import { useWorkspace } from 'contexts/workspace-context'
import { navMenuButtonClass } from 'lib/nav-styles'
import { SidebarInset, SidebarProvider } from 'components/ui/sidebar'
import { TooltipProvider } from 'components/ui/tooltip'
import { cn } from 'lib/utils'

const NAV: AppNavItem[] = [
  { to: '/', icon: LayoutDashboard, labelKey: '工作台' },
  { to: '/materials', icon: Package, labelKey: '基础数据' },
  { to: '/warehouses', icon: Warehouse, labelKey: '仓库货位' },
  { to: '/inbound', icon: ArrowDownToLine, labelKey: '采购入库' },
  { to: '/outbound', icon: ArrowUpFromLine, labelKey: '出库管理' },
  { to: '/inventory', icon: Boxes, labelKey: '库存盘点' },
  { to: '/alerts', icon: Bell, labelKey: '智能预警' },
  { to: '/trace', icon: ScanLine, labelKey: '扫码追溯' },
]

const ADMIN_NAV: AppNavItem[] = [{ to: '/admin', icon: Settings, labelKey: '系统管理' }]

function Brand() {
  const { t } = useTranslation()
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-sm">
        <Shield className="size-4 text-primary-foreground" />
      </div>
      <div className="hidden sm:block">
        <p className="font-display text-sm font-bold leading-none">IMES</p>
        <p className="text-[10px] text-muted-foreground">{t('应急物资智能管理')}</p>
      </div>
    </div>
  )
}

function AppNavLinks({ items, tasksActive }: { items: AppNavItem[]; tasksActive: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  const linkClass = (active: boolean) => navMenuButtonClass(active, true)

  return (
    <>
      {items.map(({ to, icon: Icon, labelKey }) => {
        const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
        const label = t(labelKey)
        return (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass(active)} title={label}>
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{label}</span>
          </NavLink>
        )
      })}
      <ApprovalInboxNavItem className={linkClass(tasksActive)} />
    </>
  )
}

function HeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <NotificationCenter />
      <UserMenu />
    </div>
  )
}

function MainContent({ inset }: { inset?: boolean }) {
  return (
    <main
      className={cn(
        'leader-content-pad mx-auto min-h-0 w-full flex-1',
        inset ? 'overflow-y-auto overscroll-contain' : undefined,
      )}
    >
      <div className="leader-content-wrap mx-auto w-full">
        <WorkspacePageShell>
          <ApprovalReminderBanner />
          <Outlet />
        </WorkspacePageShell>
      </div>
    </main>
  )
}

function TopLayout({ navItems }: { navItems: AppNavItem[] }) {
  const location = useLocation()
  const tasksActive = location.pathname.startsWith('/tasks')

  return (
    <div className="flex min-h-screen w-full flex-col" data-cheta-layout data-imes-nav-mode="top">
      <header className="leader-nav sticky top-0 z-50 w-full border-b">
        <div className="flex h-14 w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
          <Brand />
          <nav className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <AppNavLinks items={navItems} tasksActive={tasksActive} />
          </nav>
          <HeaderActions />
        </div>
      </header>
      <MainContent />
    </div>
  )
}

function LeftLayout({ navItems }: { navItems: AppNavItem[] }) {
  return (
    <SidebarProvider
      className="flex h-svh max-h-svh w-full overflow-hidden"
      style={{ background: 'var(--leader-page-bg, hsl(var(--background)))' }}
    >
      <div className="flex h-svh max-h-svh w-full overflow-hidden" data-cheta-layout data-imes-nav-mode="left">
        <AppSidebar navItems={navItems} />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col bg-transparent py-2 pl-1 pr-2 md:py-3 md:pl-1.5 md:pr-3">
          <div
            className={cn(
              'flex h-full max-h-full min-h-0 flex-col overflow-hidden',
              'rounded-2xl bg-card md:rounded-[1.25rem]',
            )}
            style={{
              background: 'var(--leader-card-bg, hsl(var(--card)))',
              boxShadow:
                'var(--leader-card-shadow, 0 1px 2px rgba(15,23,42,0.04), 0 8px 32px -8px rgba(15,23,42,0.12))',
            }}
          >
            <MainContent inset />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default function Layout() {
  const { canManageSystem } = useAuth()
  const { prefs } = useWorkspace()
  useApprovalDesktopNotify()
  const navItems = canManageSystem ? [...NAV, ...ADMIN_NAV] : NAV

  return (
    <TooltipProvider delayDuration={300}>
      <AuthSession />
      {prefs.navLayout === 'left' ? (
        <LeftLayout navItems={navItems} />
      ) : (
        <TopLayout navItems={navItems} />
      )}
    </TooltipProvider>
  )
}

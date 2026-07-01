import type { ElementType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client'
import { ChevronsLeft, ChevronsRight, ClipboardCheck, Shield } from 'lucide-react'
import { NotificationCenter } from 'components/notification-center'
import { UserMenu } from 'components/settings-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from 'components/ui/sidebar'
import { GET_INBOX_COUNT } from 'pages/tasks/queries'
import { navMenuButtonClass } from 'lib/nav-styles'
import { cn } from 'lib/utils'

export type AppNavItem = { to: string; icon: ElementType; labelKey: string; shortLabelKey?: string }

function SidebarCollapseButton({ collapsed }: { collapsed: boolean }) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      title={collapsed ? '展开侧栏' : '收起侧栏'}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-foreground',
        collapsed ? 'size-8' : 'size-7',
      )}
    >
      {collapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
    </button>
  )
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2', collapsed && 'flex-none justify-center')}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
        <Shield className="size-3.5 text-primary-foreground" />
      </div>
      {!collapsed && (
        <p className="min-w-0 truncate font-display text-[12px] font-semibold leading-tight tracking-tight">
          IMES
          <span className="ml-1 font-normal text-muted-foreground">{t('应急物资智能管理')}</span>
        </p>
      )}
    </div>
  )
}

function NavMenuItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string
  icon: ElementType
  label: string
  end?: boolean
}) {
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={navMenuButtonClass(active, collapsed)}
      >
        <NavLink to={to} end={end ?? to === '/'}>
          <Icon className="size-[15px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function TasksNavItem() {
  const { t } = useTranslation()
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const active = location.pathname.startsWith('/tasks')
  const { data } = useQuery(GET_INBOX_COUNT, { pollInterval: 30_000 })
  const count = (data?.getApprovalInboxCount as { count?: number })?.count ?? 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={t('待办中心')}
        className={navMenuButtonClass(active, collapsed)}
      >
        <NavLink to="/tasks">
          <ClipboardCheck className="size-[15px] shrink-0" strokeWidth={1.75} />
          <span className="truncate">{t('待办中心')}</span>
        </NavLink>
      </SidebarMenuButton>
      {count > 0 && (
        <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

export function AppSidebar({
  navItems,
  showApprovalInbox = true,
}: {
  navItems: AppNavItem[]
  showApprovalInbox?: boolean
}) {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="[&_[data-sidebar=sidebar]]:!flex [&_[data-sidebar=sidebar]]:!h-svh [&_[data-sidebar=sidebar]]:!overflow-hidden [&_[data-sidebar=sidebar]]:!bg-transparent"
    >
      <SidebarHeader
        className={cn(
          'shrink-0 flex-row items-center gap-1.5 p-0 px-2',
          collapsed ? 'h-12 justify-center' : 'h-12 justify-between',
        )}
      >
        <Brand collapsed={collapsed} />
        <SidebarCollapseButton collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-1.5 py-2">
        <SidebarMenu className="gap-0.5">
          {navItems.map(({ to, icon, labelKey }) => (
            <NavMenuItem key={to} to={to} icon={icon} label={t(labelKey)} end={to === '/'} />
          ))}
          {showApprovalInbox && <TasksNavItem />}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto shrink-0 px-1.5 pb-2 pt-1">
        <div className="space-y-0.5">
          <NotificationCenter placement="sidebar" collapsed={collapsed} />
          <UserMenu placement="sidebar" collapsed={collapsed} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

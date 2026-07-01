import { Outlet, useLocation } from 'react-router-dom'
import { Boxes, Bell, CalendarClock, ArrowLeftRight, Package, ScanLine, Truck } from 'lucide-react'
import { AppSidebar, type AppNavItem } from 'components/app-sidebar'
import { MobileAppBar } from 'components/mobile-app-bar'
import { OpsMobileBottomNav } from 'components/ops-mobile-bottom-nav'
import { ApprovalReminderBanner } from 'components/approval-inbox'
import { WorkspacePageShell } from 'components/workspace-page-shell'
import { SidebarProvider } from 'components/ui/sidebar'
import {
  MOBILE_OPS_HOME,
  MOBILE_OPS_ME,
  MOBILE_OPS_SCAN,
  MOBILE_OPS_SHIP,
  MOBILE_OPS_TOOLS_ALERTS,
  MOBILE_OPS_TOOLS_EXPIRY,
  MOBILE_OPS_TOOLS_STOCKTAKE,
  MOBILE_OPS_TOOLS_TRANSFER,
  shouldHideApprovalBanner,
  shouldHideMobileAppBar,
  shouldHideMobileBottomNav,
} from 'lib/mobile-ops'

const OPS_DRAWER_NAV: AppNavItem[] = [
  { to: MOBILE_OPS_HOME, icon: Package, labelKey: '收货' },
  { to: MOBILE_OPS_SHIP, icon: Truck, labelKey: '发货' },
  { to: MOBILE_OPS_SCAN, icon: ScanLine, labelKey: '扫码追溯', shortLabelKey: '扫码' },
  { to: MOBILE_OPS_TOOLS_STOCKTAKE, icon: Boxes, labelKey: '盘点任务', shortLabelKey: '盘点' },
  { to: MOBILE_OPS_TOOLS_EXPIRY, icon: CalendarClock, labelKey: '效期巡检', shortLabelKey: '效期' },
  { to: MOBILE_OPS_TOOLS_TRANSFER, icon: ArrowLeftRight, labelKey: '移库调位', shortLabelKey: '移库' },
  { to: MOBILE_OPS_TOOLS_ALERTS, icon: Bell, labelKey: '预警待办', shortLabelKey: '预警' },
]

export function MobilePreviewLayout({
  showApprovalInbox,
}: {
  showApprovalInbox: boolean
}) {
  const { pathname } = useLocation()
  const hideAppBar = shouldHideMobileAppBar(pathname)
  const hideBanner = shouldHideApprovalBanner(pathname)
  const hideBottomNav = shouldHideMobileBottomNav(pathname)

  return (
    <SidebarProvider forceMobile className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <AppSidebar navItems={OPS_DRAWER_NAV} showApprovalInbox={showApprovalInbox && !hideBanner} />
      <div
        className="mobile-ops-light-shell flex h-full min-h-0 w-full flex-col overflow-hidden"
        data-imes-mobile-preview-layout
        data-mobile-ops-tabbar={hideBottomNav ? 'false' : 'true'}
      >
        {!hideAppBar && <MobileAppBar />}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <WorkspacePageShell className={hideAppBar ? 'space-y-0' : 'space-y-4'}>
            {!hideBanner && <ApprovalReminderBanner />}
            <Outlet />
          </WorkspacePageShell>
        </main>
        {!hideBottomNav && <OpsMobileBottomNav />}
      </div>
    </SidebarProvider>
  )
}

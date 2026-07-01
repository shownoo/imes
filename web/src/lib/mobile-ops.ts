import { readStoredDevicePreview } from 'lib/device-preview'
import type { WorkModeId } from 'lib/work-mode'

export const MOBILE_OPS_HOME = '/ops'
export const MOBILE_OPS_SCAN = '/ops/scan'
export const MOBILE_OPS_ME = '/ops/me'
export const MOBILE_OPS_ME_RECEIVED = '/ops/received'
export const MOBILE_OPS_ME_SHIPPED = '/ops/shipped'
export const MOBILE_OPS_SHIP = `${MOBILE_OPS_HOME}?tab=ship`
export const MOBILE_OPS_TOOLS = '/ops/tools'
export const MOBILE_OPS_TOOLS_STOCKTAKE = '/ops/stocktake'
export const MOBILE_OPS_TOOLS_TRANSFER = '/ops/transfer'
export const MOBILE_OPS_TOOLS_EXPIRY = '/ops/expiry'
export const MOBILE_OPS_TOOLS_ALERTS = '/ops/alerts'

export type MobileTodoTab = 'receive' | 'ship'

export function parseMobileTodoTab(value: string | null): MobileTodoTab {
  return value === 'ship' ? 'ship' : 'receive'
}

/** 仓管作业默认落地页：手机端 → 待办 hub，电脑端 → 入库列表 */
export function resolveOperationsLandingPath(userId?: string | null): string {
  if (userId && readStoredDevicePreview(userId) === 'mobile') return MOBILE_OPS_HOME
  return '/inbound'
}

export function resolveDefaultLandingPath(mode: WorkModeId, userId?: string | null): string {
  if (mode === 'operations') return resolveOperationsLandingPath(userId)
  return '/'
}

/** 子页面（详情）隐藏全局顶栏，使用页内返回导航 */
export function shouldHideMobileAppBar(pathname: string): boolean {
  if (pathname.startsWith('/ops')) return true
  if (/^\/inbound\/[^/]+$/.test(pathname)) return true
  if (/^\/outbound\/[^/]+$/.test(pathname)) return true
  return false
}

/** 任务详情页、现场工具子页隐藏底部 Tab */
export function shouldHideMobileBottomNav(pathname: string): boolean {
  if (/^\/inbound\/[^/]+$/.test(pathname)) return true
  if (/^\/outbound\/[^/]+$/.test(pathname)) return true
  if (/^\/ops\/(stocktake|transfer|expiry|alerts|received|shipped)/.test(pathname)) return true
  return false
}

export function isMobileOpsDetailRoute(pathname: string): boolean {
  return shouldHideMobileBottomNav(pathname)
}

/** 待办 hub 不展示审批横幅 */
export function shouldHideApprovalBanner(pathname: string): boolean {
  return pathname.startsWith('/ops')
}

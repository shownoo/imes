import { translate } from 'locales'
import type { AppNavItem } from 'components/app-sidebar'
import type { ViewPerspectiveId } from 'lib/workspace-theme'
import type { User } from 'lib/apollo'
import { canManageSystem } from 'lib/auth'
import { MOBILE_OPS_HOME, MOBILE_OPS_ME, MOBILE_OPS_ME_RECEIVED, MOBILE_OPS_ME_SHIPPED, MOBILE_OPS_SCAN, resolveOperationsLandingPath, MOBILE_OPS_TOOLS, MOBILE_OPS_TOOLS_STOCKTAKE, MOBILE_OPS_TOOLS_TRANSFER, MOBILE_OPS_TOOLS_EXPIRY, MOBILE_OPS_TOOLS_ALERTS } from 'lib/mobile-ops'

export type WorkModeId = 'management' | 'operations'

export const WORK_MODE_STORAGE_PREFIX = 'imes-work-mode:'

export const WORK_MODES: Array<{
  id: WorkModeId
  label: string
  desc: string
  perspective: ViewPerspectiveId
}> = [
  {
    id: 'management',
    label: translate('管理视角'),
    desc: translate('审批、主数据与全量单据'),
    perspective: 'operator',
  },
  {
    id: 'operations',
    label: translate('仓管作业'),
    desc: translate('收货、拣货等现场操作'),
    perspective: 'warehouse',
  },
]

/** 入库：仓管作业默认只看已审核待收货 */
export const INBOUND_OPERATIONS_DEFAULT_STATUS = 'RECEIVING'
export const INBOUND_OPERATIONS_STATUS_FILTERS = ['RECEIVING', 'COMPLETED'] as const

/** 出库：待作业 = 已审核 + 拣货中 */
export const OUTBOUND_OPERATIONS_ACTIVE_STATUS = 'active'
export const OUTBOUND_OPERATIONS_DEFAULT_STATUS = OUTBOUND_OPERATIONS_ACTIVE_STATUS
export const OUTBOUND_OPERATIONS_STATUS_FILTERS = [
  OUTBOUND_OPERATIONS_ACTIVE_STATUS,
  'SHIPPED',
  'COMPLETED',
] as const

export function workModeStorageKey(userId: string): string {
  return `${WORK_MODE_STORAGE_PREFIX}${userId}`
}

export function canSwitchWorkMode(user: User | null | undefined): boolean {
  if (!user) return false
  return user.role === 'ADMIN' || user.role === 'SUPERVISOR'
}

export function getDefaultWorkModeFromRole(role: string | undefined): WorkModeId {
  if (role === 'WAREHOUSE_KEEPER' || role === 'VIEWER') return 'operations'
  return 'management'
}

export function getDefaultWorkMode(user: User | null | undefined): WorkModeId {
  if (!user) return 'management'
  return getDefaultWorkModeFromRole(user.role)
}

export function readStoredWorkMode(userId: string): WorkModeId | null {
  try {
    const raw = localStorage.getItem(workModeStorageKey(userId))
    if (raw === 'management' || raw === 'operations') return raw
  } catch {
    /* ignore */
  }
  return null
}

export function saveWorkMode(userId: string, mode: WorkModeId): void {
  try {
    localStorage.setItem(workModeStorageKey(userId), mode)
  } catch {
    /* ignore */
  }
}

export function resolveWorkMode(user: User | null | undefined): WorkModeId {
  if (!user) return 'management'
  if (!canSwitchWorkMode(user)) return 'operations'
  const stored = readStoredWorkMode(user.id)
  if (stored) return stored
  return getDefaultWorkMode(user)
}

export function getDefaultLandingPath(mode: WorkModeId, userId?: string | null): string {
  if (mode === 'operations') return resolveOperationsLandingPath(userId)
  return '/'
}

const OPERATIONS_NAV_PATHS = new Set([
  '/',
  MOBILE_OPS_HOME,
  MOBILE_OPS_SCAN,
  MOBILE_OPS_ME,
  MOBILE_OPS_TOOLS,
  MOBILE_OPS_TOOLS_STOCKTAKE,
  MOBILE_OPS_TOOLS_TRANSFER,
  MOBILE_OPS_TOOLS_EXPIRY,
  MOBILE_OPS_TOOLS_ALERTS,
  MOBILE_OPS_ME_RECEIVED,
  MOBILE_OPS_ME_SHIPPED,
  '/inbound',
  '/outbound',
  '/inventory',
  '/alerts',
  '/trace',
])

export function filterNavByWorkMode(items: AppNavItem[], mode: WorkModeId): AppNavItem[] {
  if (mode === 'management') return items
  return items.filter((item) => OPERATIONS_NAV_PATHS.has(item.to))
}

export function shouldShowAdminNav(mode: WorkModeId, canAdmin: boolean): boolean {
  return canAdmin && mode === 'management'
}

export function shouldShowApprovalInbox(mode: WorkModeId): boolean {
  return mode === 'management'
}

export function shouldShowOrderCreate(mode: WorkModeId): boolean {
  return mode === 'management'
}

export function resolveInboundListQuery(statusFilter: string): { status?: string } {
  if (statusFilter === 'all') return {}
  return { status: statusFilter }
}

export function resolveOutboundListQuery(statusFilter: string): { status?: string; statuses?: string } {
  if (statusFilter === OUTBOUND_OPERATIONS_ACTIVE_STATUS) {
    return { statuses: 'APPROVED,PICKING' }
  }
  if (statusFilter === 'history') {
    return { statuses: 'SHIPPED,COMPLETED' }
  }
  if (statusFilter === 'all') return {}
  return { status: statusFilter }
}

export function getWorkModeLabel(mode: WorkModeId): string {
  return WORK_MODES.find((m) => m.id === mode)?.label ?? mode
}

export function getWorkModePerspective(mode: WorkModeId): ViewPerspectiveId {
  return WORK_MODES.find((m) => m.id === mode)?.perspective ?? 'operator'
}

/** 管理视角下是否展示系统管理入口（与 canManageSystem 组合） */
export function canAccessAdminInMode(mode: WorkModeId, user: User | null | undefined): boolean {
  return mode === 'management' && canManageSystem(user)
}

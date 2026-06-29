import { gql, useQuery } from '@apollo/client'
import { translate } from 'locales'
import { getStoredUser, type User } from './apollo'

const ROLE_ZH: Record<string, string> = {
  ADMIN: '系统管理员',
  SUPERVISOR: '仓储主管',
  WAREHOUSE_KEEPER: '仓管员',
  VIEWER: '只读访客',
}

const MODULE_ZH: Record<string, string> = {
  system: '系统管理',
  material: '物资档案',
  category: '物资大类',
  supplier: '供应商',
  warehouse: '库区货位',
  inbound: '采购入库',
  outbound: '出库管理',
  stock: '库存盘点',
  dashboard: '工作台',
  alert: '智能预警',
  trace: '扫码追溯',
}

const ACTION_ZH: Record<string, string> = {
  read: '查看',
  write: '编辑',
  delete: '删除',
  approve: '审核',
}

/** @deprecated prefer getRoleLabel() for translated labels */
export const ROLE_LABELS: Record<string, string> = ROLE_ZH

/** @deprecated prefer getModuleLabel() */
export const MODULE_LABELS: Record<string, string> = MODULE_ZH

/** @deprecated prefer getActionLabel() */
export const ACTION_LABELS: Record<string, string> = ACTION_ZH

export function getRoleLabel(role: string): string {
  return translate(ROLE_ZH[role] ?? role)
}

export function getModuleLabel(module: string): string {
  return translate(MODULE_ZH[module] ?? module)
}

export function getActionLabel(action: string): string {
  return translate(ACTION_ZH[action] ?? action)
}

export const ME = gql`
  query Me {
    me
  }
`

export function hasPermission(user: User | null | undefined, code: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.permissions?.includes('*')) return true
  return user.permissions?.includes(code) ?? false
}

export function hasAnyPermission(user: User | null | undefined, ...codes: string[]): boolean {
  return codes.some((c) => hasPermission(user, c))
}

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN'
}

export function isSupervisor(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'
}

export function canManageSystem(user: User | null | undefined): boolean {
  return hasAnyPermission(user, 'system:user:read', 'system:role:read', 'system:log:read')
}

export function useAuth() {
  const stored = getStoredUser()
  const { data, loading } = useQuery(ME, { skip: !stored })

  const identity = (data?.me as User | null) ?? stored

  return {
    user: identity,
    loading: Boolean(stored && loading),
    hasPermission: (code: string) => hasPermission(identity, code),
    hasAnyPermission: (...codes: string[]) => hasAnyPermission(identity, ...codes),
    isAdmin: isAdmin(identity),
    isSupervisor: isSupervisor(identity),
    canManageSystem: canManageSystem(identity),
  }
}

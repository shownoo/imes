/** 权限点定义（模块:操作，对齐企业 RBAC 惯例） */
export interface PermissionDef {
  code: string
  name: string
  module: string
  action: string
  description?: string
}

export const PERMISSIONS: PermissionDef[] = [
  // 系统管理
  { code: 'system:user:read', name: '查看用户', module: 'system', action: 'read' },
  { code: 'system:user:write', name: '管理用户', module: 'system', action: 'write' },
  { code: 'system:role:read', name: '查看角色', module: 'system', action: 'read' },
  { code: 'system:role:write', name: '管理角色', module: 'system', action: 'write' },
  { code: 'system:log:read', name: '查看操作日志', module: 'system', action: 'read' },
  // 基础数据
  { code: 'material:read', name: '查看物资', module: 'material', action: 'read' },
  { code: 'material:write', name: '编辑物资', module: 'material', action: 'write' },
  { code: 'material:delete', name: '删除物资', module: 'material', action: 'delete' },
  { code: 'category:read', name: '查看大类', module: 'category', action: 'read' },
  { code: 'category:write', name: '编辑大类', module: 'category', action: 'write' },
  { code: 'category:delete', name: '删除大类', module: 'category', action: 'delete' },
  { code: 'supplier:read', name: '查看供应商', module: 'supplier', action: 'read' },
  { code: 'supplier:write', name: '编辑供应商', module: 'supplier', action: 'write' },
  { code: 'supplier:delete', name: '删除供应商', module: 'supplier', action: 'delete' },
  // 库区
  { code: 'warehouse:read', name: '查看库区', module: 'warehouse', action: 'read' },
  { code: 'warehouse:write', name: '编辑库区', module: 'warehouse', action: 'write' },
  { code: 'warehouse:delete', name: '删除库区', module: 'warehouse', action: 'delete' },
  // 出入库
  { code: 'inbound:read', name: '查看入库', module: 'inbound', action: 'read' },
  { code: 'inbound:write', name: '创建入库', module: 'inbound', action: 'write' },
  { code: 'inbound:approve', name: '审核入库', module: 'inbound', action: 'approve' },
  { code: 'outbound:read', name: '查看出库', module: 'outbound', action: 'read' },
  { code: 'outbound:write', name: '创建出库', module: 'outbound', action: 'write' },
  { code: 'outbound:approve', name: '审核出库', module: 'outbound', action: 'approve' },
  // 库存
  { code: 'stock:read', name: '查看库存', module: 'stock', action: 'read' },
  { code: 'stock:write', name: '库存调整', module: 'stock', action: 'write' },
  // 看板
  { code: 'dashboard:read', name: '查看工作台', module: 'dashboard', action: 'read' },
  { code: 'alert:read', name: '查看预警', module: 'alert', action: 'read' },
  { code: 'trace:read', name: '扫码追溯', module: 'trace', action: 'read' },
]

export const ROLE_DEFS: Array<{
  code: string
  name: string
  description: string
  system: boolean
  sort: number
  permissions: string[] | '*'
}> = [
  {
    code: 'ADMIN',
    name: '系统管理员',
    description: '拥有全部权限，可管理用户与角色',
    system: true,
    sort: 0,
    permissions: '*',
  },
  {
    code: 'SUPERVISOR',
    name: '仓储主管',
    description: '业务审批与主数据维护，不可删除关键档案',
    system: true,
    sort: 1,
    permissions: [
      'system:log:read',
      'material:read', 'material:write',
      'category:read', 'category:write',
      'supplier:read', 'supplier:write',
      'warehouse:read', 'warehouse:write',
      'inbound:read', 'inbound:write', 'inbound:approve',
      'outbound:read', 'outbound:write', 'outbound:approve',
      'stock:read', 'stock:write',
      'dashboard:read', 'alert:read', 'trace:read',
    ],
  },
  {
    code: 'WAREHOUSE_KEEPER',
    name: '仓管员',
    description: '日常收发货与库存操作',
    system: true,
    sort: 2,
    permissions: [
      'material:read', 'category:read', 'supplier:read',
      'warehouse:read',
      'inbound:read', 'inbound:write',
      'outbound:read', 'outbound:write',
      'stock:read', 'stock:write',
      'dashboard:read', 'alert:read', 'trace:read',
    ],
  },
  {
    code: 'VIEWER',
    name: '只读访客',
    description: '仅可查看数据，不可修改',
    system: true,
    sort: 3,
    permissions: PERMISSIONS.filter((p) => p.action === 'read').map((p) => p.code),
  },
]

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_DEFS.map((r) => [r.code, r.name]),
)

export const MODULE_LABELS: Record<string, string> = {
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

export const ACTION_LABELS: Record<string, string> = {
  read: '查看',
  write: '编辑',
  delete: '删除',
  approve: '审核',
}

export function resolveRolePermissionCodes(permissions: string[] | '*'): string[] {
  if (permissions === '*') return PERMISSIONS.map((p) => p.code)
  return permissions
}

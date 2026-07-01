/** Stable `tableKey` slugs for DataTable column persistence (localStorage). */
export const TABLE_KEYS = {
  INBOUND_PURCHASE_MASTER: 'inbound-purchase-master',
  OUTBOUND_MASTER: 'outbound-master',
  MATERIALS_MASTER: 'materials-master',
  MATERIALS_CATEGORY: 'materials-category',
  MATERIALS_SUPPLIER: 'materials-supplier',
  MATERIALS_OUTBOUND_PURPOSE: 'materials-outbound-purpose',
  MATERIALS_OUTBOUND_DESTINATION: 'materials-outbound-destination',
  MATERIALS_SHELF: 'materials-shelf',
  INVENTORY_SUMMARY: 'inventory-summary',
  INVENTORY_STOCK: 'inventory-stock',
  INVENTORY_MOVEMENTS: 'inventory-movements',
  ALERTS: 'alerts-master',
  TASKS_APPROVALS: 'tasks-approvals',
  TASKS_SUBMITTED: 'tasks-submitted',
  TASKS_DOCUMENTS: 'tasks-documents',
  DASHBOARD_APPROVALS: 'dashboard-approvals',
  DASHBOARD_DOCUMENTS: 'dashboard-documents',
  DASHBOARD_ALERTS: 'dashboard-alerts',
  ADMIN_USERS: 'admin-users',
  ADMIN_ROLES: 'admin-roles',
  ADMIN_LOGS: 'admin-logs',
  ADMIN_PRINT_TEMPLATES: 'admin-print-templates',
  SYSTEM_LOGS: 'system-logs',
} as const

export type TableKey = (typeof TABLE_KEYS)[keyof typeof TABLE_KEYS]

/** 本地日历日 YYYY-MM-DD，用于与计划日期比较 */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isPlannedDateOverdue(
  order: Record<string, unknown>,
  field: 'plannedReceiveDate' | 'plannedShipDate',
  now = new Date(),
): boolean {
  const planned = order[field]
  if (!planned) return false
  const plannedDate = new Date(String(planned))
  if (Number.isNaN(plannedDate.getTime())) return false
  return toLocalDateKey(now) > toLocalDateKey(plannedDate)
}

/** 收货待办是否已过计划收货日（无计划日时不推断） */
export function isInboundReceiveOverdue(order: Record<string, unknown>, now = new Date()): boolean {
  return isPlannedDateOverdue(order, 'plannedReceiveDate', now)
}

/** 发货待办是否已过计划发货日（无计划日时不推断） */
export function isOutboundShipOverdue(order: Record<string, unknown>, now = new Date()): boolean {
  return isPlannedDateOverdue(order, 'plannedShipDate', now)
}

export function countInboundReceiveOverdue(
  orders: Array<Record<string, unknown>>,
  now = new Date(),
): number {
  return orders.filter((order) => isInboundReceiveOverdue(order, now)).length
}

export function countOutboundShipOverdue(
  orders: Array<Record<string, unknown>>,
  now = new Date(),
): number {
  return orders.filter((order) => isOutboundShipOverdue(order, now)).length
}

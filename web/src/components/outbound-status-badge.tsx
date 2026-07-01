import { StatusBadge } from 'components/status-badge'
import { resolveOutboundDisplayStatus } from 'lib/outbound-display'

type OutboundOrderLike = {
  status: unknown
  lines?: Array<{ requestedQty: number; pickedQty?: number | null }>
}

/** 出库单状态徽章 — PICKING 且全拣齐时展示「待出库」 */
export function OutboundStatusBadge({
  order,
  className,
  compact,
}: {
  order: OutboundOrderLike
  className?: string
  compact?: boolean
}) {
  const lines = order.lines ?? []
  const displayStatus = resolveOutboundDisplayStatus(String(order.status), lines)
  return <StatusBadge status={displayStatus} className={className} compact={compact} />
}

import { StatusBadge } from 'components/status-badge'
import { resolveInboundDisplayStatus } from 'lib/inbound-display'

type InboundOrderLike = {
  status: unknown
  lines?: Array<{ expectedQty: number; actualQty?: number | null }>
}

/** 入库单状态徽章 — RECEIVING 且全收齐时展示「待入库」 */
export function InboundStatusBadge({
  order,
  className,
  compact,
}: {
  order: InboundOrderLike
  className?: string
  compact?: boolean
}) {
  const lines = order.lines ?? []
  const displayStatus = resolveInboundDisplayStatus(String(order.status), lines)
  return <StatusBadge status={displayStatus} className={className} compact={compact} />
}

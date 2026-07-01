import { ChevronRight, Truck } from 'lucide-react'
import { OutboundStatusBadge } from 'components/outbound-status-badge'
import { resolveOutboundListAction } from 'lib/outbound-display'
import { formatDate } from 'lib/utils'

type OutboundOrder = Record<string, unknown>

export function OutboundTaskCard({
  order,
  onOpen,
}: {
  order: OutboundOrder
  onOpen: () => void
}) {
  const lines = (order.lines as Array<{ requestedQty: number; pickedQty?: number | null }>) ?? []
  const destination = String(order.destination ?? '—')
  const purpose = String(order.purpose ?? '')
  const status = String(order.status)
  const actionLabel = resolveOutboundListAction(status, lines)

  return (
    <button type="button" onClick={onOpen} className="mobile-ops-card mobile-ops-task-card">
      <div className="mobile-ops-card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mobile-ops-task-order-no">{String(order.orderNo ?? '—')}</p>
            <p className="mobile-ops-card-subtitle mt-1">{destination}</p>
            {purpose && purpose !== destination && (
              <p className="mobile-ops-card-subtitle mt-0.5">{purpose}</p>
            )}
          </div>
          <OutboundStatusBadge order={{ status, lines }} compact />
        </div>

        <div className="mobile-ops-task-meta">
          <span className="inline-flex items-center gap-1">
            <Truck className="size-3.5 shrink-0 opacity-60" />
            {lines.length} 行物资
          </span>
          <span aria-hidden>·</span>
          <span>
            {order.plannedShipDate
              ? `计划 ${formatDate(String(order.plannedShipDate))}`
              : formatDate(String(order.createdAt))}
          </span>
        </div>
      </div>

      <div className="mobile-ops-card-divider" aria-hidden />
      <span className="mobile-ops-action-row mobile-ops-action-row--nav mobile-ops-task-card-nav" aria-hidden>
        <span>{actionLabel}</span>
        <ChevronRight className="mobile-ops-action-chevron" />
      </span>
    </button>
  )
}

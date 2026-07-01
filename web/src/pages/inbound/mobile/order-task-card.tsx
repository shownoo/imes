import { ChevronRight, Package } from 'lucide-react'
import { InboundStatusBadge } from 'components/inbound-status-badge'
import { summarizeInboundReceive } from '../receive-summary'
import { receiveListAction } from 'lib/mobile-receive-action'
import { cn, formatDate } from 'lib/utils'

type InboundOrder = Record<string, unknown>

export function OrderTaskCard({
  order,
  onOpen,
}: {
  order: InboundOrder
  onOpen: () => void
}) {
  const lines = (order.lines as Array<{ expectedQty: number; actualQty?: number | null }>) ?? []
  const summary = summarizeInboundReceive(lines)
  const supplier = (order.supplier as { name?: string })?.name ?? '—'
  const warehouse = (order.warehouse as { name?: string })?.name ?? '—'
  const receiving = order.status === 'RECEIVING'
  const progress = summary.progress
  const hasPending = receiving && summary.pending > 0
  const action = receiveListAction({
    pending: summary.pending,
    expected: summary.totalExpected,
    started: summary.hasStarted,
    viewOnly: !hasPending,
  })
  const inProgress = action.tone === 'continue'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('mobile-ops-card mobile-ops-task-card', inProgress && 'mobile-ops-task-card--in-progress')}
    >
      <div className="mobile-ops-card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mobile-ops-task-order-no">{String(order.orderNo ?? '—')}</p>
            <p className="mobile-ops-card-subtitle mt-1">{supplier}</p>
          </div>
          <InboundStatusBadge order={{ status: order.status, lines }} compact />
        </div>

        <div className="mobile-ops-task-meta">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5 shrink-0 opacity-60" />
            {warehouse}
          </span>
          <span aria-hidden>·</span>
          <span>{lines.length} 行物资</span>
          <span aria-hidden>·</span>
          <span>{formatDate(String(order.orderDate ?? order.createdAt))}</span>
        </div>

        {receiving && summary.totalExpected > 0 && (
          <div className="mobile-ops-task-progress">
            <div
              className={cn(
                'mobile-ops-task-progress-labels',
                progress === 0 && 'mobile-ops-task-progress-labels--idle',
              )}
            >
              <span>
                已收 {summary.totalActual.toLocaleString()} / {summary.totalExpected.toLocaleString()}
              </span>
              <span className="tabular-nums">
                {progress > 0 ? (
                  <span className={cn(inProgress && 'mobile-ops-task-progress-pct--active')}>{progress}%</span>
                ) : (
                  '待收'
                )}
              </span>
            </div>
            <div className="mobile-ops-progress-track">
              <div
                className={cn(
                  'mobile-ops-progress-fill',
                  summary.receiveFull && 'mobile-ops-progress-fill--done',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mobile-ops-card-divider" aria-hidden />
      <span
        className={cn(
          'mobile-ops-action-row mobile-ops-action-row--nav mobile-ops-task-card-nav',
          action.tone === 'continue' && 'mobile-ops-task-card-nav--continue',
          action.tone === 'start' && 'mobile-ops-task-card-nav--start',
          action.tone === 'view' && 'mobile-ops-task-card-nav--view',
        )}
        aria-hidden
      >
        <span className="mobile-ops-task-card-action-label">
          {inProgress && <span className="mobile-ops-task-card-action-dot" aria-hidden />}
          <span>{action.label}</span>
        </span>
        <ChevronRight
          className={cn('mobile-ops-action-chevron', inProgress && 'mobile-ops-action-chevron--active')}
        />
      </span>
    </button>
  )
}

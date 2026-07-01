import { CheckCircle2, ChevronRight, Printer } from 'lucide-react'
import { linePending } from '../receive-lines-table'
import { LineReceiveOutcome } from '../receive-summary'
import { receiveActionLabel } from 'lib/mobile-receive-action'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type InboundLine = Record<string, unknown>

export function ReceiveLineCard({
  line,
  receiving,
  orderCompleted,
  onReceive,
  onReprint,
}: {
  line: InboundLine
  receiving: boolean
  orderCompleted?: boolean
  onReceive: () => void
  onReprint?: (stockItem: Record<string, unknown>) => void
}) {
  const material = line.material as { name?: string; spec?: string; unit?: string; code?: string } | undefined
  const expected = Number(line.expectedQty)
  const actual = Number(line.actualQty ?? 0)
  const pending = linePending(line)
  const canReceive = receiving && pending > 0
  const stockItems = (line.stockItems as Array<Record<string, unknown>>) ?? []
  const done = orderCompleted && actual > 0 && actual === expected
  const showStats = actual > 0 || !canReceive
  const actionLabel = receiveActionLabel({ pending, expected, started: actual > 0 })

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mobile-ops-card-title">{material?.name ?? '—'}</h3>
          {(material?.spec || material?.code) && (
            <p className="mobile-ops-card-subtitle">
              {[material?.spec, material?.code].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <LineReceiveOutcome line={line} receiving={receiving} />
      </div>

      {showStats && (
        <dl className="mobile-ops-stat-group">
          <div className="mobile-ops-stat-group-cell">
            <dt>{'预计'}</dt>
            <dd>
              {expected.toLocaleString()}
              {material?.unit ? <span className="mobile-ops-stat-unit">{material.unit}</span> : null}
            </dd>
          </div>
          <div className={cn('mobile-ops-stat-group-cell', done && 'mobile-ops-stat-group-cell--done')}>
            <dt>{'实收'}</dt>
            <dd>{actual.toLocaleString()}</dd>
          </div>
          <div className={cn('mobile-ops-stat-group-cell', pending > 0 && 'mobile-ops-stat-group-cell--pending')}>
            <dt>{'待收'}</dt>
            <dd>{pending.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      {stockItems.length > 0 && (
        <ul className="mobile-ops-batch-list">
          {stockItems.map((item, i) => {
            const batchNo = (item.batch as { batchNo?: string })?.batchNo ?? '—'
            const shelf = (item.shelf as { code?: string })?.code
            return (
              <li key={String(item.id ?? i)}>
                <span className="truncate font-medium">{batchNo}</span>
                <span className="shrink-0 mobile-ops-card-subtitle">
                  {Number(item.quantity ?? 0).toLocaleString()}
                  {shelf ? ` · ${shelf}` : ' · 未上架'}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {done && (
        <p className="mobile-ops-done-hint">
          <CheckCircle2 className="size-4" />{'本行已收齐'}</p>
      )}
    </>
  )

  return (
    <article className="mobile-ops-card mobile-ops-card--receive">
      {canReceive ? (
        <button type="button" className="mobile-ops-line-card-hit" onClick={onReceive}>
          <div className="mobile-ops-card-body">{body}</div>
          <div className="mobile-ops-card-divider" aria-hidden />
          <span className="mobile-ops-action-row mobile-ops-action-row--nav mobile-ops-line-card-nav" aria-hidden>
            <span>{actionLabel}</span>
            <ChevronRight className="mobile-ops-action-chevron" />
          </span>
        </button>
      ) : (
        <div className="mobile-ops-card-body">{body}</div>
      )}

      {stockItems.length > 0 && onReprint && (
        <div className={cn('flex flex-wrap gap-2 px-4 pb-3', canReceive && 'border-t border-[var(--mobile-ios-separator)] pt-3')}>
          {stockItems.map((item, i) => (
            <button
              key={String(item.id ?? i)}
              type="button"
              className="mobile-ops-btn mobile-ops-btn--compact gap-1.5"
              onClick={() => onReprint(item)}
            >
              <Printer className="size-3.5" />
              {stockItems.length > 1 ? `补打 ${(item.batch as { batchNo?: string })?.batchNo ?? i + 1}` : '补打标签'}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

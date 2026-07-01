import { CheckCircle2, ChevronRight } from 'lucide-react'
import { LinePickOutcome, linePendingPick } from '../pick-summary'
import { pickActionLabel } from 'lib/mobile-pick-action'
import { cn } from 'lib/utils'

type OutboundLine = Record<string, unknown>

export function PickLineCard({
  line,
  picking,
  orderShipped,
  onPick,
}: {
  line: OutboundLine
  picking: boolean
  orderShipped?: boolean
  onPick: () => void
}) {
  const material = line.material as { name?: string; spec?: string; unit?: string; code?: string } | undefined
  const requested = Number(line.requestedQty)
  const picked = Number(line.pickedQty ?? 0)
  const pending = linePendingPick(line)
  const canPick = picking && pending > 0
  const lineFullyPicked = picked > 0 && picked === requested
  const showDoneHint = lineFullyPicked && picking && !orderShipped
  const showStats = picked > 0 || !canPick
  const actionLabel = pickActionLabel({ pending, requested, started: picked > 0 })

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
        <LinePickOutcome line={line} picking={picking} mobile />
      </div>

      {showStats && (
        <dl className="mobile-ops-stat-group">
          <div className="mobile-ops-stat-group-cell">
            <dt>{'申请'}</dt>
            <dd>
              {requested.toLocaleString()}
              {material?.unit ? <span className="mobile-ops-stat-unit">{material.unit}</span> : null}
            </dd>
          </div>
          <div className={cn('mobile-ops-stat-group-cell', lineFullyPicked && 'mobile-ops-stat-group-cell--done')}>
            <dt>{'已拣'}</dt>
            <dd>{picked.toLocaleString()}</dd>
          </div>
          <div className={cn('mobile-ops-stat-group-cell', pending > 0 && 'mobile-ops-stat-group-cell--pending')}>
            <dt>{'待拣'}</dt>
            <dd>{pending.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      {showDoneHint && (
        <p className="mobile-ops-done-hint">
          <CheckCircle2 className="size-4" />{'本行已拣齐'}</p>
      )}
    </>
  )

  return (
    <article className="mobile-ops-card mobile-ops-card--receive">
      {canPick ? (
        <button type="button" className="mobile-ops-line-card-hit" onClick={onPick}>
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
    </article>
  )
}

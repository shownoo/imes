import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from 'lib/utils'
import { useTranslation } from 'react-i18next'

type OutboundLine = Record<string, unknown>

export function linePickDiff(line: OutboundLine) {
  return Number(line.pickedQty ?? 0) - Number(line.requestedQty)
}

export function linePendingPick(line: OutboundLine) {
  return Math.max(0, Number(line.requestedQty) - Number(line.pickedQty ?? 0))
}

export function summarizeOutboundPick(lines: OutboundLine[]) {
  const totalRequested = lines.reduce((sum, line) => sum + Number(line.requestedQty), 0)
  const totalPicked = lines.reduce((sum, line) => sum + Number(line.pickedQty ?? 0), 0)
  const pickDiff = totalPicked - totalRequested
  const pending = Math.max(0, totalRequested - totalPicked)
  const progress = totalRequested > 0 ? Math.min(100, Math.round((totalPicked / totalRequested) * 100)) : 0
  const lineCount = lines.length

  let fullLines = 0
  let shortLines = 0
  let overLines = 0
  let unpickedLines = 0

  for (const line of lines) {
    const picked = Number(line.pickedQty ?? 0)
    const requested = Number(line.requestedQty)
    if (picked <= 0) {
      unpickedLines += 1
      continue
    }
    const diff = picked - requested
    if (diff === 0) fullLines += 1
    else if (diff < 0) shortLines += 1
    else overLines += 1
  }

  const pickFull = pickDiff === 0 && totalPicked > 0 && unpickedLines === 0

  return {
    totalRequested,
    totalPicked,
    pickDiff,
    pending,
    progress,
    lineCount,
    fullLines,
    shortLines,
    overLines,
    unpickedLines,
    pickFull,
    hasStarted: totalPicked > 0,
  }
}

export function LinePickOutcome({
  line,
  picking,
  mobile,
}: {
  line: OutboundLine
  picking?: boolean
  /** 手机端卡片 — Apple HIG 胶囊徽章 */
  mobile?: boolean
}) {
  const { t } = useTranslation()
  const requested = Number(line.requestedQty)
  const picked = Number(line.pickedQty ?? 0)
  const pending = Math.max(0, requested - picked)

  if (picked <= 0) {
    if (picking && pending > 0) {
      if (mobile) {
        return (
          <span className="mobile-ops-badge mobile-ops-badge--pending">
            待拣 {pending.toLocaleString()}
          </span>
        )
      }
      return (
        <span className="inline-flex rounded-full bg-orange-500/12 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-orange-600">
          待拣 {pending.toLocaleString()}
        </span>
      )
    }
    return <span className="text-[15px] text-muted-foreground/35">—</span>
  }

  const diff = picked - requested
  if (diff === 0) {
    if (mobile) {
      return (
        <span className="mobile-ops-badge mobile-ops-badge--done">
          <CheckCircle2 className="size-3 shrink-0" />{t('拣齐')}</span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/12 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
        <CheckCircle2 className="size-3 shrink-0" />{t('拣齐')}</span>
    )
  }

  const label = diff < 0 ? `少拣 ${Math.abs(diff).toLocaleString()}` : `超拣 ${diff.toLocaleString()}`
  if (mobile) {
    return (
      <span className="mobile-ops-badge mobile-ops-badge--warn">
        <AlertTriangle className="size-3 shrink-0" />
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/12 px-2.5 py-0.5 text-[11px] font-medium text-orange-600">
      <AlertTriangle className="size-3 shrink-0" />
      {label}
    </span>
  )
}

export type OutboundPickPhase = 'picking' | 'shipped' | 'completed'

export function PickSummaryPanel({
  lines,
  picking,
  phase = 'picking',
  embedded,
  compact,
}: {
  lines: OutboundLine[]
  picking?: boolean
  /** 单据阶段：拣货中 / 已出库待结案 / 已结案 */
  phase?: OutboundPickPhase
  embedded?: boolean
  compact?: boolean
}) {
  const { t } = useTranslation()
  const summary = summarizeOutboundPick(lines)
  if (summary.totalRequested <= 0) return null
  if (!picking && !summary.hasStarted && summary.unpickedLines === summary.lineCount) return null

  const { pickFull, pickDiff, progress, lineCount, fullLines, shortLines, overLines, unpickedLines } = summary
  const showLineDetail = lineCount > 1 && phase === 'picking'

  const statusLabel =
    phase === 'completed'
      ? '已结案'
      : phase === 'shipped'
        ? '待结案'
        : pickFull
          ? '拣货完成'
          : picking && summary.pending > 0
            ? '拣货中'
            : pickDiff < 0
              ? `少拣 ${Math.abs(pickDiff)}`
              : pickDiff > 0
                ? `超拣 ${pickDiff}`
                : '待拣货'

  const statusTone =
    phase === 'completed' || (phase === 'picking' && pickFull)
      ? 'emerald'
      : phase === 'shipped'
        ? 'teal'
        : pickDiff !== 0 || unpickedLines > 0
          ? 'amber'
          : 'muted'

  return (
    <div
      className={cn(
        compact ? 'space-y-1.5 px-4 py-3' : 'space-y-2.5 px-4 py-3.5 sm:px-5',
        !embedded && 'rounded-xl border',
        embedded && !compact && 'border-t border-border/40 px-3.5 py-3',
        embedded && compact && 'border-t border-border/40',
        !embedded && statusTone === 'emerald' && 'border-emerald-500/15 bg-emerald-500/[0.06]',
        !embedded && statusTone === 'teal' && 'border-teal-500/15 bg-teal-500/[0.06]',
        !embedded && statusTone === 'amber' && 'border-amber-500/15 bg-amber-500/[0.06]',
        !embedded && statusTone === 'muted' && 'border-border/40 bg-muted/35',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium">{t('拣货进度')}</span>
        <span className="font-number tabular-nums">{progress}%</span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-foreground/[0.06]', compact ? 'h-1' : 'h-1.5')}>
        <div
          className={cn(
            'h-full rounded-full transition-all',
            phase === 'shipped'
              ? 'bg-teal-500'
              : pickFull || phase === 'completed'
                ? 'bg-emerald-500'
                : pickDiff !== 0
                  ? 'bg-amber-500'
                  : 'bg-primary/70',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={cn(
        'flex flex-wrap items-center gap-x-2.5 gap-y-0.5',
        compact ? 'text-[11px]' : 'text-sm',
      )}
      >
        <span>{t('已拣')}<span className="font-number font-semibold tabular-nums text-foreground">{summary.totalPicked.toLocaleString()}</span>
          <span className="text-muted-foreground"> / 申请 {summary.totalRequested.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground/35 select-none" aria-hidden>·</span>
        <span className={cn(
          'inline-flex items-center gap-1 font-medium',
          statusTone === 'emerald'
            ? 'text-emerald-600'
            : statusTone === 'teal'
              ? 'text-teal-600'
              : statusTone === 'amber'
                ? 'text-amber-600'
                : 'text-foreground/80',
        )}
        >
          {(pickFull || phase === 'shipped' || phase === 'completed')
            ? <CheckCircle2 className={cn('shrink-0', compact ? 'size-3' : 'size-4')} />
            : pickDiff !== 0
              ? <AlertTriangle className={cn('shrink-0', compact ? 'size-3' : 'size-4')} />
              : null}
          {statusLabel}
        </span>
        {picking && summary.pending > 0 && !pickFull && (
          <>
            <span className="text-muted-foreground/40 select-none" aria-hidden>·</span>
            <span className="text-muted-foreground">待拣 {summary.pending}</span>
          </>
        )}
        {showLineDetail && (
          <>
            <span className="text-muted-foreground/40 select-none" aria-hidden>·</span>
            <span className="text-muted-foreground">
              {fullLines}/{lineCount} 行拣齐
              {shortLines > 0 && ` · ${shortLines} 行少拣`}
              {overLines > 0 && ` · ${overLines} 行超拣`}
              {unpickedLines > 0 && ` · ${unpickedLines} 行未拣`}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

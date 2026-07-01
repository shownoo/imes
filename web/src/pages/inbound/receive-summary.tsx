import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from 'lib/utils'

type InboundLine = Record<string, unknown>

export function lineReceiveDiff(line: InboundLine) {
  return Number(line.actualQty ?? 0) - Number(line.expectedQty)
}

export function summarizeInboundReceive(lines: InboundLine[]) {
  const totalExpected = lines.reduce((sum, line) => sum + Number(line.expectedQty), 0)
  const totalActual = lines.reduce((sum, line) => sum + Number(line.actualQty ?? 0), 0)
  const receiveDiff = totalActual - totalExpected
  const pending = Math.max(0, totalExpected - totalActual)
  const progress = totalExpected > 0 ? Math.min(100, Math.round((totalActual / totalExpected) * 100)) : 0
  const lineCount = lines.length

  let fullLines = 0
  let shortLines = 0
  let overLines = 0
  let unreceivedLines = 0

  for (const line of lines) {
    const actual = Number(line.actualQty ?? 0)
    const expected = Number(line.expectedQty)
    if (actual <= 0) {
      unreceivedLines += 1
      continue
    }
    const diff = actual - expected
    if (diff === 0) fullLines += 1
    else if (diff < 0) shortLines += 1
    else overLines += 1
  }

  const receiveFull = receiveDiff === 0 && totalActual > 0 && unreceivedLines === 0

  return {
    totalExpected,
    totalActual,
    receiveDiff,
    pending,
    progress,
    lineCount,
    fullLines,
    shortLines,
    overLines,
    unreceivedLines,
    receiveFull,
    hasStarted: totalActual > 0,
  }
}

export function LineReceiveOutcome({ line, receiving }: { line: InboundLine; receiving?: boolean }) {
  const expected = Number(line.expectedQty)
  const actual = Number(line.actualQty ?? 0)
  const pending = Math.max(0, expected - actual)

  if (actual <= 0) {
    if (receiving && pending > 0) {
      return (
        <span className="inline-flex rounded-full bg-orange-500/12 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-orange-600">
          待收 {pending.toLocaleString()}
        </span>
      )
    }
    return <span className="text-[15px] text-muted-foreground/35">—</span>
  }

  const diff = actual - expected
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/12 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
        <CheckCircle2 className="size-3 shrink-0" />
        收齐
      </span>
    )
  }

  const label = diff < 0 ? `少收 ${Math.abs(diff).toLocaleString()}` : `超收 ${diff.toLocaleString()}`
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/12 px-2.5 py-0.5 text-[11px] font-medium text-orange-600">
      <AlertTriangle className="size-3 shrink-0" />
      {label}
    </span>
  )
}

export function ReceiveSummaryPanel({
  lines,
  receiving,
  embedded,
  compact,
}: {
  lines: InboundLine[]
  receiving?: boolean
  /** 嵌在元信息卡片底部 — 无独立圆角边框 */
  embedded?: boolean
  /** 单行紧凑布局 */
  compact?: boolean
}) {
  const summary = summarizeInboundReceive(lines)
  if (summary.totalExpected <= 0) return null
  if (!receiving && !summary.hasStarted && summary.unreceivedLines === summary.lineCount) return null

  const { receiveFull, receiveDiff, progress, lineCount, fullLines, shortLines, overLines, unreceivedLines } = summary
  const showLineDetail = lineCount > 1

  const statusLabel = receiveFull
    ? '收齐入库'
    : receiving && summary.pending > 0
      ? '收货中'
      : receiveDiff < 0
        ? `少收 ${Math.abs(receiveDiff)}`
        : receiveDiff > 0
          ? `超收 ${receiveDiff}`
          : '待收货'

  const statusTone = receiveFull ? 'emerald' : receiveDiff !== 0 || unreceivedLines > 0 ? 'amber' : 'muted'

  return (
    <div
      className={cn(
        compact ? 'space-y-1.5 px-4 py-3' : 'space-y-2.5 px-4 py-3.5 sm:px-5',
        !embedded && 'rounded-xl border',
        embedded && !compact && 'border-t border-border/40 px-3.5 py-3',
        embedded && compact && 'border-t border-border/40',
        !embedded && statusTone === 'emerald' && 'border-emerald-500/15 bg-emerald-500/[0.06]',
        !embedded && statusTone === 'amber' && 'border-amber-500/15 bg-amber-500/[0.06]',
        !embedded && statusTone === 'muted' && 'border-border/40 bg-muted/35',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium">收货进度</span>
        <span className="font-number tabular-nums">{progress}%</span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-foreground/[0.06]', compact ? 'h-1' : 'h-1.5')}>
        <div
          className={cn(
            'h-full rounded-full transition-all',
            receiveFull ? 'bg-emerald-500' : receiveDiff !== 0 ? 'bg-amber-500' : 'bg-primary/70',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={cn(
        'flex flex-wrap items-center gap-x-2.5 gap-y-0.5',
        compact ? 'text-[11px]' : 'text-sm',
      )}
      >
        <span>
          实收 <span className="font-number font-semibold tabular-nums text-foreground">{summary.totalActual.toLocaleString()}</span>
          <span className="text-muted-foreground"> / 预计 {summary.totalExpected.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground/35 select-none" aria-hidden>·</span>
        <span className={cn(
          'inline-flex items-center gap-1 font-medium',
          receiveFull ? 'text-emerald-600' : receiveDiff !== 0 ? 'text-amber-600' : 'text-foreground/80',
        )}
        >
          {receiveFull
            ? <CheckCircle2 className={cn('shrink-0', compact ? 'size-3' : 'size-4')} />
            : receiveDiff !== 0
              ? <AlertTriangle className={cn('shrink-0', compact ? 'size-3' : 'size-4')} />
              : null}
          {statusLabel}
        </span>
        {receiving && summary.pending > 0 && !receiveFull && (
          <>
            <span className="text-muted-foreground/40 select-none" aria-hidden>·</span>
            <span className="text-muted-foreground">待收 {summary.pending}</span>
          </>
        )}
        {showLineDetail && (
          <>
            <span className="text-muted-foreground/40 select-none" aria-hidden>·</span>
            <span className="text-muted-foreground">
              {fullLines}/{lineCount} 行收齐
              {shortLines > 0 && ` · ${shortLines} 行少收`}
              {overLines > 0 && ` · ${overLines} 行超收`}
              {unreceivedLines > 0 && ` · ${unreceivedLines} 行未收`}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

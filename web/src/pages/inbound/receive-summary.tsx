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
      return <span className="text-xs text-muted-foreground">待收 {pending}</span>
    }
    return <span className="text-muted-foreground">—</span>
  }

  const diff = actual - expected
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="size-3.5 shrink-0" />
        足额
      </span>
    )
  }

  const label = diff < 0 ? `少收 ${Math.abs(diff)}` : `超收 ${diff}`
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
      <AlertTriangle className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}

export function ReceiveSummaryPanel({
  lines,
  receiving,
}: {
  lines: InboundLine[]
  receiving?: boolean
}) {
  const summary = summarizeInboundReceive(lines)
  if (summary.totalExpected <= 0) return null
  if (!receiving && !summary.hasStarted && summary.unreceivedLines === summary.lineCount) return null

  const { receiveFull, receiveDiff, progress, lineCount, fullLines, shortLines, overLines, unreceivedLines } = summary
  const showLineDetail = lineCount > 1

  const statusLabel = receiveFull
    ? '足额入库'
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
        'col-span-2 space-y-2.5 rounded-lg px-4 py-3 sm:col-span-4',
        statusTone === 'emerald' && 'bg-emerald-500/[0.06]',
        statusTone === 'amber' && 'bg-amber-500/[0.06]',
        statusTone === 'muted' && 'bg-muted/50',
      )}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>收货进度</span>
        <span className="tabular-nums">{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            receiveFull ? 'bg-emerald-500' : receiveDiff !== 0 ? 'bg-amber-500' : 'bg-primary/70',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          实收 <span className="font-medium tabular-nums text-foreground">{summary.totalActual}</span>
          <span className="text-muted-foreground"> / 预计 {summary.totalExpected}</span>
        </span>
        <span className="text-muted-foreground/40 select-none" aria-hidden>·</span>
        <span className={cn(
          'inline-flex items-center gap-1.5 font-medium',
          receiveFull ? 'text-emerald-600' : receiveDiff !== 0 ? 'text-amber-600' : 'text-foreground/80',
        )}
        >
          {receiveFull
            ? <CheckCircle2 className="size-4 shrink-0" />
            : receiveDiff !== 0
              ? <AlertTriangle className="size-4 shrink-0" />
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
              {fullLines}/{lineCount} 行足额
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

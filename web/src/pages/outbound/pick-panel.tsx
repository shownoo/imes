import { Info, MapPin } from 'lucide-react'
import { Button } from 'components/common'
import { ActionLink } from 'components/action-link'
import { QrScanInput } from 'components/qr-scan-input'
import { ALERT_LEVEL, cn, formatDate } from 'lib/utils'

type PickSuggestion = Record<string, unknown>

type PickPanelProps = {
  materialName: string
  unit?: string
  requestedQty: number
  pickedQty: number
  pendingQty: number
  suggestions: PickSuggestion[]
  routeTotal?: number
  shortage?: number
  firstStop?: PickSuggestion
  scanQr: string
  onScanQrChange: (value: string) => void
  onScanSubmit: (qr: string) => void
  onSelectSuggestion: (qr: string) => void
  onCancel: () => void
  scanning?: boolean
  picking?: boolean
  className?: string
}

export function PickPanel({
  materialName,
  unit,
  requestedQty,
  pickedQty,
  pendingQty,
  suggestions,
  routeTotal,
  shortage,
  firstStop,
  scanQr,
  onScanQrChange,
  onScanSubmit,
  onSelectSuggestion,
  onCancel,
  scanning,
  picking,
  className,
}: PickPanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/50 bg-muted/25 shadow-[0_1px_2px_hsl(0_0%_0%/0.03)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-3.5 py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">
            FIFO 拣货 · {materialName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            效期优先 · 同效期按货位就近
          </p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onCancel}>
          取消
        </Button>
      </div>

      <div className="space-y-4 px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <span>
            申请 <span className="font-number font-semibold tabular-nums">{requestedQty.toLocaleString()}</span>
            {unit ? ` ${unit}` : ''}
          </span>
          <span className="text-muted-foreground/35">·</span>
          <span>
            已拣 <span className="font-number font-medium tabular-nums text-foreground">{pickedQty.toLocaleString()}</span>
          </span>
          <span className="text-muted-foreground/35">·</span>
          <span className="text-orange-600">
            待拣 <span className="font-number font-semibold tabular-nums">{pendingQty.toLocaleString()}</span>
          </span>
        </div>

        {firstStop && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-primary">
                智能指引 · 第 {String(firstStop.routeStep ?? 1)} 站
              </p>
              <p className="mt-0.5 text-[15px] font-semibold tracking-tight">
                {firstStop.zone ? `${String(firstStop.zone)}区 · ` : ''}{String(firstStop.shelfCode ?? '—')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                建议拣取 {String(firstStop.pickQty)}，在库 {String((firstStop.stockItem as { quantity?: number })?.quantity ?? firstStop.available)}
              </p>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border/40 bg-card/80">
            <div className="border-b border-border/35 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              拣货路线{routeTotal ? ` · 共 ${routeTotal} 站` : ''}
            </div>
            <ul className="divide-y divide-border/25">
              {suggestions.map((s, i) => {
                const item = s.stockItem as Record<string, unknown> | undefined
                const batch = item?.batch as { expiryDate?: string } | undefined
                const level = String(s.expiryLevel)
                return (
                  <li key={String(item?.id ?? i)} className="flex items-center gap-2 px-3 py-2 text-[13px]">
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                      {String(s.routeStep ?? i + 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {s.zone ? `${String(s.zone)}区 · ` : ''}{String(s.shelfCode)} · 可拣 {String(s.pickQty)}
                      {batch?.expiryDate ? ` · 效期 ${formatDate(batch.expiryDate)}` : ''}
                    </span>
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px]', ALERT_LEVEL[level]?.color ?? 'bg-muted')}>
                      {ALERT_LEVEL[level]?.label ?? level}
                    </span>
                    <ActionLink
                      className="shrink-0 text-[13px]"
                      onClick={() => void onSelectSuggestion(String(item?.qrCode ?? ''))}
                    >
                      选用
                    </ActionLink>
                  </li>
                )
              })}
            </ul>
            {(shortage ?? 0) > 0 && (
              <p className="border-t border-border/35 px-3 py-2 text-xs text-destructive">
                库存不足，尚缺 {shortage}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3 py-2.5',
            'border-sky-200/70 bg-sky-50/90 text-sky-950/90',
            'dark:border-sky-900/45 dark:bg-sky-950/35 dark:text-sky-100/90',
          )}
          role="note"
        >
          <Info className="mt-0.5 size-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
          <p className="min-w-0 flex-1 text-[11px] leading-relaxed">
            扫描物资二维码核对后，输入本次出库数量；若拆零将自动生成新标签。
          </p>
        </div>

        <div className="max-w-lg">
          <QrScanInput
            value={scanQr}
            onChange={onScanQrChange}
            onSubmit={onScanSubmit}
            disabled={scanning || picking}
            placeholder="扫描物资二维码"
          />
        </div>
      </div>
    </div>
  )
}

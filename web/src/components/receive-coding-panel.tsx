import { Info } from 'lucide-react'
import { FormField, groupedFormInputClass, DatePicker } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { cn, formatDate } from 'lib/utils'
import { parseLocalDateStr } from 'components/inline-date-picker'

export type ReceiveCodingForm = {
  actualQty: number
  batchNo: string
  productionDate: string
}

export type ReceivedBatchRow = {
  batchNo: string
  qty: number
  productionDate?: string
}

type ReceiveCodingPanelProps = {
  materialName: string
  unit?: string
  pendingQty: number
  expectedQty?: number
  receivedQty?: number
  receivedBatches?: ReceivedBatchRow[]
  shelfLifeMonths?: number | null
  value: ReceiveCodingForm
  onChange: (next: ReceiveCodingForm) => void
  onCancel: () => void
  onSubmit: () => void
  submitting?: boolean
  className?: string
}

function addMonths(dateStr: string, months: number): Date | null {
  if (!dateStr || !months) return null
  const d = parseLocalDateStr(dateStr)
  if (!d) return null
  d.setMonth(d.getMonth() + months)
  return d
}

export function ReceiveCodingPanel({
  materialName,
  unit,
  pendingQty,
  expectedQty,
  receivedQty = 0,
  receivedBatches = [],
  shelfLifeMonths,
  value,
  onChange,
  onCancel,
  onSubmit,
  submitting,
  className,
}: ReceiveCodingPanelProps) {
  const expiry = shelfLifeMonths ? addMonths(value.productionDate, shelfLifeMonths) : null
  const qtyInvalid = value.actualQty <= 0 || value.actualQty > pendingQty
  const multiBatch = receivedBatches.length > 0 || (expectedQty != null && expectedQty > pendingQty)

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
            收货赋码 · {materialName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {multiBatch ? '可分多批收货，每批独立批次号与二维码' : '录入批次效期，系统自动生成二维码'}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onCancel}>
          取消
        </Button>
      </div>

      <div className="space-y-4 px-3.5 py-3">
        {expectedQty != null && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span>
              预计 <span className="font-number font-semibold tabular-nums">{expectedQty.toLocaleString()}</span>
              {unit ? ` ${unit}` : ''}
            </span>
            <span className="text-muted-foreground/35">·</span>
            <span>
              已收 <span className="font-number font-medium tabular-nums text-foreground">{receivedQty.toLocaleString()}</span>
            </span>
            <span className="text-muted-foreground/35">·</span>
            <span className="text-orange-600">
              待收 <span className="font-number font-semibold tabular-nums">{pendingQty.toLocaleString()}</span>
            </span>
          </div>
        )}

        {receivedBatches.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border/40 bg-card/80">
            <div className="border-b border-border/35 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              已收批次 ({receivedBatches.length})
            </div>
            <ul className="divide-y divide-border/25">
              {receivedBatches.map((row, i) => (
                <li key={`${row.batchNo}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <span className="truncate font-medium">{row.batchNo}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.qty.toLocaleString()}{unit ? ` ${unit}` : ''}
                    {row.productionDate ? ` · ${formatDate(row.productionDate)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
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
            本批最多收{' '}
            <span className="font-semibold tabular-nums">{pendingQty.toLocaleString()}</span>
            {unit ? ` ${unit}` : ''}
            ；确认后生成唯一二维码并弹出打印标签。
            {multiBatch && pendingQty > value.actualQty && (
              <> 打码完成后可继续录入下一批次，直至本行收齐。</>
            )}
            {expiry && (
              <>
                {' '}
                按大类保质期推算效期至{' '}
                <span className="font-medium tabular-nums">{formatDate(expiry.toISOString())}</span>。
              </>
            )}
          </p>
        </div>

        <div className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="本批数量" required>
            <Input
              type="number"
              min={1}
              max={pendingQty}
              className={cn(groupedFormInputClass, 'tabular-nums')}
              value={value.actualQty || ''}
              onChange={(e) => onChange({ ...value, actualQty: Number(e.target.value) })}
            />
            {qtyInvalid && value.actualQty > 0 && (
              <p className="text-xs text-destructive">数量须在 1～{pendingQty.toLocaleString()} 之间</p>
            )}
          </FormField>
          <FormField label="生产批次号" required>
            <Input
              className={groupedFormInputClass}
              value={value.batchNo}
              placeholder="录入外包装批次号"
              onChange={(e) => onChange({ ...value, batchNo: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">与送货单或外包装标签保持一致</p>
          </FormField>
          <FormField label="生产日期" required className="sm:col-span-2 lg:col-span-1">
            <DatePicker
              value={value.productionDate}
              onChange={(v) => onChange({ ...value, productionDate: v ?? '' })}
            />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            className="h-9 px-5"
            disabled={submitting || !value.batchNo.trim() || !value.productionDate || qtyInvalid}
            onClick={onSubmit}
          >
            {submitting ? '处理中…' : multiBatch ? '确认本批并打码' : '确认收货并打码'}
          </Button>
        </div>
      </div>
    </div>
  )
}

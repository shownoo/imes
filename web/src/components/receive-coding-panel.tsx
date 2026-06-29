import { Info } from 'lucide-react'
import { FormField } from 'components/form-page'
import { Button } from 'components/common'
import { Input } from 'components/ui/input'
import { cn, formatDate } from 'lib/utils'

export type ReceiveCodingForm = {
  actualQty: number
  batchNo: string
  productionDate: string
}

type ReceiveCodingPanelProps = {
  materialName: string
  unit?: string
  pendingQty: number
  shelfLifeMonths?: number | null
  value: ReceiveCodingForm
  onChange: (next: ReceiveCodingForm) => void
  onCancel: () => void
  onSubmit: () => void
  submitting?: boolean
  className?: string
}

function addMonths(isoDate: string, months: number): Date | null {
  if (!isoDate || !months) return null
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return null
  d.setMonth(d.getMonth() + months)
  return d
}

export function ReceiveCodingPanel({
  materialName,
  unit,
  pendingQty,
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

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">
            收货赋码 · {materialName}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">'录入批次效期，系统自动生成二维码'</p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={onCancel}
        >'取消'</button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
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
            本次未收{' '}
            <span className="font-semibold tabular-nums">{pendingQty}</span>
            {unit ? ` ${unit}` : ''}
            ，实收数量不可超过未收；确认后将生成唯一二维码并弹出打印标签。
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
          <FormField label='实际到货数量' required>
            <Input
              type="number"
              min={1}
              max={pendingQty}
              className="h-9 text-[13px] tabular-nums"
              value={value.actualQty || ''}
              onChange={(e) => onChange({ ...value, actualQty: Number(e.target.value) })}
            />
            {qtyInvalid && value.actualQty > 0 && (
              <p className="text-xs text-destructive">数量须在 1～{pendingQty} 之间</p>
            )}
          </FormField>
          <FormField label='生产批次号' required>
            <Input
              className="h-9 text-[13px]"
              value={value.batchNo}
              placeholder='如 BATCH-202606'
              onChange={(e) => onChange({ ...value, batchNo: e.target.value })}
            />
          </FormField>
          <FormField label='生产日期' required className="sm:col-span-2 lg:col-span-1">
            <Input
              type="date"
              className="h-9 text-[13px]"
              value={value.productionDate}
              onChange={(e) => onChange({ ...value, productionDate: e.target.value })}
            />
          </FormField>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            className="h-9 px-5"
            disabled={submitting || !value.batchNo.trim() || !value.productionDate || qtyInvalid}
            onClick={onSubmit}
          >
            {submitting ? '处理中…' : '确认收货并打码'}
          </Button>
        </div>
      </div>
    </div>
  )
}

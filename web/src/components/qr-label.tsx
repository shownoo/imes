import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from 'lib/utils'

export type QrLabelData = {
  qrCode: string
  title: string
  subtitle?: string
  meta?: string[]
}

type QrLabelProps = QrLabelData & {
  size?: number
  className?: string
  /** 打印专用样式 */
  printMode?: boolean
}

export const QrLabel = forwardRef<HTMLDivElement, QrLabelProps>(function QrLabel(
  { qrCode, title, subtitle, meta, size = 120, className, printMode },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        printMode ? 'qr-label-print' : 'flex flex-col items-center rounded-lg border bg-card p-4 text-center',
        className,
      )}
      style={printMode ? undefined : { borderColor: 'var(--leader-card-border)' }}
    >
      <QRCodeSVG value={qrCode} size={size} level="M" includeMargin={false} />
      <p className={cn(printMode ? 'qr-label-print__title' : 'mt-3 text-sm font-semibold leading-snug')}>
        {title}
      </p>
      {subtitle && (
        <p className={cn(printMode ? 'qr-label-print__sub' : 'mt-1 text-xs text-muted-foreground')}>{subtitle}</p>
      )}
      <p className={cn(printMode ? 'qr-label-print__code' : 'mt-2 max-w-full break-all font-mono text-[10px] text-muted-foreground')}>
        {qrCode}
      </p>
      {meta && meta.length > 0 && (
        <p className={cn(printMode ? 'qr-label-print__meta' : 'mt-1 text-[10px] text-muted-foreground')}>
          {meta.join(' · ')}
        </p>
      )}
    </div>)
})

/** 从库存行构建标签数据 */
export function stockItemToLabel(row: Record<string, unknown>): QrLabelData {
  const material = row.material as { name?: string; unit?: string } | undefined
  const batch = row.batch as { batchNo?: string; expiryDate?: string } | undefined
  const shelf = row.shelf as { code?: string } | undefined
  const meta: string[] = []
  if (batch?.batchNo) meta.push(`批次 ${batch.batchNo}`)
  if (row.quantity != null) meta.push(`数量 ${row.quantity}${material?.unit ?? ''}`)
  if (shelf?.code) meta.push(`货位 ${shelf.code}`)
  return {
    qrCode: String(row.qrCode ?? ''),
    title: material?.name ?? '应急物资',
    subtitle: batch?.batchNo ? `批次 ${batch.batchNo}` : undefined,
    meta: meta.length ? meta : undefined,
  }
}

/** 从货位行构建标签数据 */
export function shelfToLabel(row: Record<string, unknown>): QrLabelData {
  const warehouse = row.warehouse as { name?: string } | undefined
  return {
    qrCode: String(row.qrCode ?? `SHELF-${row.code}`),
    title: String(row.name ?? row.code ?? '货位'),
    subtitle: warehouse?.name,
    meta: [`编码 ${String(row.code ?? '')}`, `区域 ${String(row.zone ?? '')}`],
  }
}

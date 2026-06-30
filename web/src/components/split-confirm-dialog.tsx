import { MapPin, Package } from 'lucide-react'
import { NumericKeypad } from 'components/numeric-keypad'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { ALERT_LEVEL, formatDate } from 'lib/utils'

export type SplitConfirmStock = {
  qrCode: string
  quantity: number
  shelfCode?: string
  zone?: string
  expiryDate?: string
  expiryLevel?: string
  materialName: string
  unit?: string
}

type SplitConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  stock: SplitConfirmStock | null
  requestedQty: number
  pickedQty: number
  onChangeQty: (qty: number) => void
  onConfirm: () => void
  confirming?: boolean
}

export function SplitConfirmDialog({
  open,
  onOpenChange,
  stock,
  requestedQty,
  pickedQty,
  onChangeQty,
  onConfirm,
  confirming,
}: SplitConfirmDialogProps) {
  if (!stock) return null

  const maxPick = Math.min(stock.quantity, requestedQty)
  const remaining = stock.quantity - pickedQty
  const willSplit = pickedQty > 0 && pickedQty < stock.quantity
  const level = stock.expiryLevel ?? 'GREEN'
  const levelStyle = ALERT_LEVEL[level]

  const invalid = pickedQty <= 0 || pickedQty > maxPick

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle>拆零确认</DialogTitle>
          <DialogDescription>核对在库数量后输入本次出库数量，拆零将自动生成剩余物资新码</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Package className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{stock.materialName}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{stock.qrCode}</p>
                {stock.shelfCode && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {stock.zone ? `${stock.zone}区 · ` : ''}{stock.shelfCode}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">在库</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {stock.quantity}
                  <span className="ml-0.5 text-sm font-normal text-muted-foreground">{stock.unit}</span>
                </p>
              </div>
            </div>
            {stock.expiryDate && (
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-muted-foreground">效期 {formatDate(stock.expiryDate)}</span>
                {levelStyle && (
                  <span className={`rounded px-1.5 py-0.5 ${levelStyle.color}`}>{levelStyle.label}</span>
                )}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">本次出库数量（待拣 {requestedQty}{stock.unit ?? ''}）</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">
              {pickedQty || '—'}
              {stock.unit && <span className="ml-1 text-lg font-normal text-muted-foreground">{stock.unit}</span>}
            </p>
            {willSplit && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                拆零后剩余 <span className="font-semibold tabular-nums">{remaining}</span> {stock.unit}，将打印新标签
              </p>
            )}
            {invalid && pickedQty > 0 && (
              <p className="mt-1 text-xs text-destructive">数量须在 1～{maxPick} 之间</p>
            )}
          </div>

          <NumericKeypad value={pickedQty} onChange={onChangeQty} max={maxPick} />
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>取消</Button>
          <Button onClick={onConfirm} disabled={confirming || invalid}>
            {confirming ? '处理中…' : willSplit ? '确认拆零出库' : '确认出库'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

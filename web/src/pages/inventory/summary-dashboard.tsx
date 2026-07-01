import { useMemo } from 'react'
import { AlertTriangle, Boxes, Layers, Package } from 'lucide-react'
import { Card, CardContent, ExpiryBar } from 'components/common'
import { Skeleton } from 'components/ui/skeleton'
import { formatNumber } from 'lib/utils'
import { InventoryStatTile } from './stat-tile'

type SummaryRow = Record<string, unknown>

function computeStats(rows: SummaryRow[]) {
  let totalQty = 0
  let inStockSpecies = 0
  let abnormalStock = 0
  let expiryAlert = 0
  const expiry = { green: 0, yellow: 0, red: 0 }
  const stockStatus = { EMPTY: 0, LOW: 0, NORMAL: 0, HIGH: 0 }

  for (const row of rows) {
    const qty = Number(row.quantity ?? 0)
    totalQty += qty
    if (qty > 0) inStockSpecies += 1

    const status = String(row.stockStatus ?? 'NORMAL')
    if (status in stockStatus) stockStatus[status as keyof typeof stockStatus] += 1
    if (status === 'EMPTY' || status === 'LOW' || status === 'HIGH') abnormalStock += 1

    const level = String(row.expiryLevel ?? 'GREEN')
    if (level === 'RED') {
      expiry.red += 1
      expiryAlert += 1
    } else if (level === 'YELLOW') {
      expiry.yellow += 1
      expiryAlert += 1
    } else {
      expiry.green += 1
    }
  }

  return {
    speciesCount: rows.length,
    inStockSpecies,
    totalQty,
    abnormalStock,
    expiryAlert,
    expiry,
    stockStatus,
  }
}

export function InventorySummaryDashboard({ rows, loading }: { rows: SummaryRow[]; loading?: boolean }) {
  const stats = useMemo(() => computeStats(rows), [rows])

  if (loading) {
    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[5.5rem] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <InventoryStatTile
          label="物资品种"
          value={stats.speciesCount}
          unit="种"
          hint={`${stats.inStockSpecies} 种有库存`}
          icon={Package}
        />
        <InventoryStatTile
          label="在库总量"
          value={formatNumber(stats.totalQty)}
          hint="各物资在库数量合计"
          icon={Boxes}
        />
        <InventoryStatTile
          label="水位异常"
          value={stats.abnormalStock}
          unit="种"
          hint={`低 ${stats.stockStatus.LOW} · 零 ${stats.stockStatus.EMPTY} · 高 ${stats.stockStatus.HIGH}`}
          icon={Layers}
        />
        <InventoryStatTile
          label="效期关注"
          value={stats.expiryAlert}
          unit="种"
          hint={`预警 ${stats.expiry.red} · 临期 ${stats.expiry.yellow}`}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">效期分布</p>
            <p className="text-xs text-muted-foreground">
              正常 {stats.stockStatus.NORMAL} 种水位正常
            </p>
          </div>
          <ExpiryBar green={stats.expiry.green} yellow={stats.expiry.yellow} red={stats.expiry.red} />
        </CardContent>
      </Card>
    </div>
  )
}

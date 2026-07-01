import { AlertTriangle, Boxes, MapPin, Package } from 'lucide-react'
import { Card, CardContent, ExpiryBar } from 'components/common'
import { Skeleton } from 'components/ui/skeleton'
import { formatNumber } from 'lib/utils'
import { InventoryStatTile } from './stat-tile'
import { useTranslation } from 'react-i18next'

export type StockItemStats = {
  totalUnits: number
  totalQty: number
  shelved: number
  unshelved: number
  materialKinds: number
  expiryAlert: number
  expiry: { green: number; yellow: number; red: number }
  status: { IN_STOCK: number; IN_TRANSIT: number; ISSUED: number; SCRAPPED: number }
}

export function InventoryItemsDashboard({
  stats,
  loading,
}: {
  stats?: StockItemStats
  loading?: boolean
}) {
  const { t } = useTranslation()
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

  const expiry = stats?.expiry ?? { green: 0, yellow: 0, red: 0 }
  const inStock = stats?.status.IN_STOCK ?? 0
  const totalUnits = stats?.totalUnits ?? 0

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <InventoryStatTile
          label={t('库存单元')}
          value={formatNumber(totalUnits)}
          unit="个"
          hint={`${stats?.materialKinds ?? 0} 种物资`}
          icon={Package}
        />
        <InventoryStatTile
          label={t('在库数量')}
          value={formatNumber(stats?.totalQty ?? 0)}
          hint={`在库 ${inStock} 个单元`}
          icon={Boxes}
        />
        <InventoryStatTile
          label={t('已上架')}
          value={stats?.shelved ?? 0}
          unit="个"
          hint={`未上架 ${stats?.unshelved ?? 0} 个`}
          icon={MapPin}
        />
        <InventoryStatTile
          label={t('效期关注')}
          value={stats?.expiryAlert ?? 0}
          unit="个"
          hint={`预警 ${expiry.red} · 临期 ${expiry.yellow}`}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{t('效期分布')}</p>
            <p className="text-xs text-muted-foreground">
              在库 {inStock} 个 · 在途 {stats?.status.IN_TRANSIT ?? 0} 个
            </p>
          </div>
          <ExpiryBar green={expiry.green} yellow={expiry.yellow} red={expiry.red} />
        </CardContent>
      </Card>
    </div>
  )
}

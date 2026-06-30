import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, useQuery } from '@apollo/client'
import { ArrowLeftRight, BarChart3, QrCode } from 'lucide-react'
import { PageHeader, DataTable, Badge } from 'components/common'
import { TableCodeCell } from 'components/grid-table'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { stockItemToLabel, type QrLabelData } from 'components/qr-label'
import { SectionMenu } from 'components/section-menu'
import { Tabs, TabsContent } from 'components/ui/tabs'
import { WarehouseFilter } from 'components/warehouse-filter'
import { GET_WAREHOUSES } from 'pages/warehouses/queries'
import { MovementsSection } from 'pages/inventory/movements-section'
import { STATUS_LABELS, formatDate, ALERT_LEVEL } from 'lib/utils'

const GET_SUMMARY = gql`query GetInventorySummary($warehouseId: ID) { getInventorySummary(warehouseId: $warehouseId) }`
const GET_STOCK = gql`query GetStockItems($warehouseId: ID, $input: PaginationInput) { getStockItems(warehouseId: $warehouseId, input: $input) }`

type InventoryTab = 'summary' | 'items' | 'movements'

const INVENTORY_MENU = [
  { value: 'summary' as const, label: '库存汇总', icon: BarChart3 },
  { value: 'items' as const, label: '库存单元', icon: QrCode },
  { value: 'movements' as const, label: '库存流水', icon: ArrowLeftRight },
]

export default function Inventory() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as InventoryTab) || 'summary'
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const warehouseId = warehouseFilter === 'all' ? undefined : warehouseFilter

  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: sumData, loading: sumLoading } = useQuery(GET_SUMMARY, { variables: { warehouseId } })
  const { data: stockData, loading: stockLoading } = useQuery(GET_STOCK, {
    variables: { warehouseId, input: { take: 50 } },
  })
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

  const warehouses = (whData?.getWarehouses as { warehouses: Array<{ id: string; name: string }> })?.warehouses ?? []

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash === 'movements' && tab !== 'movements') {
      setParams({ tab: 'movements' })
    }
  }, [setParams, tab])

  const openLabel = (label: QrLabelData) => {
    setLabelData(label)
    setLabelOpen(true)
  }

  const summary = (sumData?.getInventorySummary as Array<Record<string, unknown>>) ?? []
  const items = (stockData?.getStockItems as { items: Array<Record<string, unknown>> })?.items ?? []

  const stockBadge = (s: string) => {
    const map: Record<string, 'destructive' | 'warning' | 'info' | 'success' | 'secondary'> = { EMPTY: 'destructive', LOW: 'warning', HIGH: 'info', NORMAL: 'success' }
    const labels: Record<string, string> = { EMPTY: '零库存', LOW: '低库存', HIGH: '高库存', NORMAL: '正常' }
    return <Badge variant={map[s] ?? 'secondary'}>{labels[s] ?? s}</Badge>
  }

  return (
    <div>
      <PageHeader title="库存盘点" titleTip="库存水位 · 一品一码 · 全链路流水" />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionMenu
            items={INVENTORY_MENU}
            value={tab}
            onChange={(v) => setParams({ tab: v })}
          />
          {(tab === 'summary' || tab === 'items') && (
            <WarehouseFilter
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              warehouses={warehouses}
              label="仓库"
            />
          )}
        </div>

        <TabsContent value="summary" className="mt-4">
          <DataTable loading={sumLoading} columns={[
            { key: 'name', title: '物资', tip: '物资名称', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'code', title: '编码', tip: '物资唯一编码', render: (r) => <TableCodeCell>{(r.material as { code?: string })?.code}</TableCodeCell> },
            { key: 'quantity', title: '在库数量', tip: '当前在库总数量' },
            { key: 'stockStatus', title: '水位', tip: '与安全库存上下限对比：低/正常/高/零', render: (r) => stockBadge(String(r.stockStatus)) },
            { key: 'expiryLevel', title: '效期', tip: '按最近批次效期：绿安全 / 黄临期 / 红预警', render: (r) => {
              const lv = ALERT_LEVEL[String(r.expiryLevel)] ?? { label: '—', color: 'bg-muted' }
              return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${lv.color}`} />{lv.label}</span>
            }},
            { key: 'batchCount', title: '批次数', tip: '在库批次数量，影响 FIFO 拣货' },
          ]} rows={summary} />
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <DataTable loading={stockLoading} columns={[
            { key: 'qrCode', title: '二维码', tip: '一物一码，扫码可追溯全链路', render: (r) => <TableCodeCell>{String(r.qrCode)}</TableCodeCell> },
            { key: 'material', title: '物资', tip: '所属物资档案', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'quantity', title: '数量', tip: '该二维码单元当前数量' },
            { key: 'status', title: '状态', tip: '在库 / 在途 / 已发出等', render: (r) => <Badge variant="secondary">{STATUS_LABELS[String(r.status)]}</Badge> },
            { key: 'shelf', title: '货位', tip: '扫码上架后绑定的货架位置', render: (r) => (r.shelf as { code?: string })?.code ?? '未上架' },
            { key: 'warehouse', title: '仓库', tip: '货位所属库房', render: (r) => (r.shelf as { warehouse?: { name?: string } })?.warehouse?.name ?? '—' },
            { key: 'batch', title: '批次', tip: '生产批次号，支撑 FIFO', render: (r) => <TableCodeCell>{(r.batch as { batchNo?: string })?.batchNo}</TableCodeCell> },
            { key: 'action', title: '操作', render: (r) => (
              <QrPrintButton label={stockItemToLabel(r)} onOpen={openLabel} />
            )},
          ]} rows={items} />
        </TabsContent>

        <TabsContent value="movements" id="movements" className="mt-4">
          <MovementsSection />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} />
    </div>
  )
}

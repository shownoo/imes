import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, useQuery } from '@apollo/client'
import { ArrowLeftRight, BarChart3, QrCode } from 'lucide-react'
import { PageHeader, DataTable, Badge, TABLE_KEYS } from 'components/common'
import { TableCodeCell } from 'components/grid-table'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { stockItemToLabel, type QrLabelData } from 'components/qr-label'
import { SectionMenu } from 'components/section-menu'
import { Tabs, TabsContent } from 'components/ui/tabs'
import { InventoryStockLevelFilter } from 'components/inventory-stock-level-filter'
import { FilterBarRow } from 'components/segment-filter-bar'
import { StatusFilterBar } from 'components/status-filter-bar'
import { WarehouseFilter } from 'components/warehouse-filter'
import { GET_WAREHOUSES } from 'pages/warehouses/queries'
import { InventoryItemsDashboard, type StockItemStats } from 'pages/inventory/items-dashboard'
import { MovementsSection } from 'pages/inventory/movements-section'
import { InventorySummaryDashboard } from 'pages/inventory/summary-dashboard'
import { STOCK_ITEM_STATUS_FILTERS } from 'lib/inventory-filters'
import { STATUS_LABELS, formatNumber, ALERT_LEVEL } from 'lib/utils'

const GET_SUMMARY = gql`query GetInventorySummary($warehouseId: ID) { getInventorySummary(warehouseId: $warehouseId) }`
const GET_STOCK = gql`query GetStockItems($warehouseId: ID, $status: String, $input: PaginationInput) { getStockItems(warehouseId: $warehouseId, status: $status, input: $input) }`

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
  const [stockLevelFilter, setStockLevelFilter] = useState('all')
  const [itemStatusFilter, setItemStatusFilter] = useState('all')
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)
  const [summaryPage, setSummaryPage] = useState(1)
  const [summaryPageSize, setSummaryPageSize] = useState(20)
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsPageSize, setItemsPageSize] = useState(20)

  const { data: whData } = useQuery(GET_WAREHOUSES)
  const { data: sumData, loading: sumLoading } = useQuery(GET_SUMMARY, { variables: { warehouseId } })
  const { data: stockData, loading: stockLoading } = useQuery(GET_STOCK, {
    variables: {
      warehouseId,
      status: itemStatusFilter === 'all' ? undefined : itemStatusFilter,
      input: { take: itemsPageSize, skip: (itemsPage - 1) * itemsPageSize },
    },
  })
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
  const stockResult = stockData?.getStockItems as {
    items: Array<Record<string, unknown>>
    count: number
    stats?: StockItemStats
  } | undefined
  const items = stockResult?.items ?? []
  const itemsTotal = stockResult?.count ?? 0
  const itemsStats = stockResult?.stats

  const filteredSummary = useMemo(() => {
    if (stockLevelFilter === 'all') return summary
    return summary.filter((row) => String(row.stockStatus) === stockLevelFilter)
  }, [summary, stockLevelFilter])

  const summaryTotalQty = useMemo(
    () => filteredSummary.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    [filteredSummary],
  )

  const stockLevelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: summary.length }
    for (const row of summary) {
      const s = String(row.stockStatus)
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [summary])

  const itemStatusCounts = useMemo(() => {
    if (!itemsStats) return undefined
    const { IN_STOCK, IN_TRANSIT, ISSUED, SCRAPPED } = itemsStats.status
    return {
      all: IN_STOCK + IN_TRANSIT + ISSUED + SCRAPPED,
      IN_STOCK,
      IN_TRANSIT,
      ISSUED,
      SCRAPPED,
    }
  }, [itemsStats])

  const pagedSummary = useMemo(() => {
    const start = (summaryPage - 1) * summaryPageSize
    return filteredSummary.slice(start, start + summaryPageSize)
  }, [filteredSummary, summaryPage, summaryPageSize])

  useEffect(() => {
    setSummaryPage(1)
    setItemsPage(1)
  }, [warehouseFilter, stockLevelFilter, itemStatusFilter])

  const stockBadge = (s: string) => {
    const map: Record<string, 'destructive' | 'warning' | 'info' | 'success' | 'secondary'> = { EMPTY: 'destructive', LOW: 'warning', HIGH: 'info', NORMAL: 'success' }
    const labels: Record<string, string> = { EMPTY: '零库存', LOW: '低库存', HIGH: '高库存', NORMAL: '正常' }
    return <Badge variant={map[s] ?? 'secondary'}>{labels[s] ?? s}</Badge>
  }

  return (
    <div>
      <PageHeader title="库存盘点" titleTip="库存水位 · 一品一码 · 全链路流水" />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <div className="mb-4">
          <SectionMenu
            items={INVENTORY_MENU}
            value={tab}
            onChange={(v) => setParams({ tab: v })}
          />
        </div>

        <TabsContent value="summary" className="mt-4">
          <InventorySummaryDashboard rows={summary} loading={sumLoading} />

          <FilterBarRow
            trailing={
              <WarehouseFilter
                value={warehouseFilter}
                onChange={setWarehouseFilter}
                warehouses={warehouses}
                label="仓库"
              />
            }
          >
            <InventoryStockLevelFilter
              value={stockLevelFilter}
              onChange={setStockLevelFilter}
              counts={stockLevelCounts}
            />
          </FilterBarRow>

          <p className="mb-3 text-sm text-muted-foreground">
            共 <span className="font-medium tabular-nums text-foreground">{filteredSummary.length}</span> 种物资
            · 在库总量 <span className="font-medium tabular-nums text-foreground">{formatNumber(summaryTotalQty)}</span>
          </p>

          <DataTable
            tableKey={TABLE_KEYS.INVENTORY_SUMMARY}
            loading={sumLoading}
            total={filteredSummary.length}
            page={summaryPage}
            pageSize={summaryPageSize}
            onPageChange={setSummaryPage}
            onPageSizeChange={(size) => {
              setSummaryPageSize(size)
              setSummaryPage(1)
            }}
            columns={[
            { key: 'name', title: '物资', tip: '物资名称', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'code', title: '编码', tip: '物资唯一编码', render: (r) => <TableCodeCell>{(r.material as { code?: string })?.code}</TableCodeCell> },
            { key: 'quantity', title: '在库数量', tip: '当前在库总数量', render: (r) => formatNumber(Number(r.quantity ?? 0)) },
            { key: 'stockStatus', title: '水位', tip: '与安全库存上下限对比：低/正常/高/零', render: (r) => stockBadge(String(r.stockStatus)) },
            { key: 'expiryLevel', title: '效期', tip: '按最近批次效期：绿安全 / 黄临期 / 红预警', render: (r) => {
              const lv = ALERT_LEVEL[String(r.expiryLevel)] ?? { label: '—', color: 'bg-muted' }
              return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${lv.color}`} />{lv.label}</span>
            }},
            { key: 'batchCount', title: '批次数', tip: '在库批次数量，影响 FIFO 拣货' },
          ]}
            rows={pagedSummary}
          />
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <InventoryItemsDashboard stats={itemsStats} loading={stockLoading} />

          <FilterBarRow
            trailing={
              <WarehouseFilter
                value={warehouseFilter}
                onChange={setWarehouseFilter}
                warehouses={warehouses}
                label="仓库"
              />
            }
          >
            <StatusFilterBar
              value={itemStatusFilter}
              options={STOCK_ITEM_STATUS_FILTERS}
              onChange={setItemStatusFilter}
              counts={itemStatusCounts}
            />
          </FilterBarRow>

          <p className="mb-3 text-sm text-muted-foreground">
            共 <span className="font-medium tabular-nums text-foreground">{itemsTotal}</span> 个库存单元
            · 在库数量 <span className="font-medium tabular-nums text-foreground">{formatNumber(itemsStats?.totalQty ?? 0)}</span>
            {items.length < itemsTotal ? ` · 当前显示 ${items.length} 条` : null}
          </p>

          <DataTable
            tableKey={TABLE_KEYS.INVENTORY_STOCK}
            loading={stockLoading}
            total={itemsTotal}
            page={itemsPage}
            pageSize={itemsPageSize}
            onPageChange={setItemsPage}
            onPageSizeChange={(size) => {
              setItemsPageSize(size)
              setItemsPage(1)
            }}
            columns={[
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
          ]}
            rows={items}
          />
        </TabsContent>

        <TabsContent value="movements" id="movements" className="mt-4">
          <MovementsSection />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} />
    </div>
  )
}

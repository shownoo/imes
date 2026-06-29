import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gql, useQuery } from '@apollo/client'
import { PageHeader, DataTable, Badge } from 'components/common'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { stockItemToLabel, type QrLabelData } from 'components/qr-label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { MovementsSection } from 'pages/inventory/movements-section'
import { STATUS_LABELS, formatDate, ALERT_LEVEL } from 'lib/utils'

const GET_SUMMARY = gql`query GetInventorySummary { getInventorySummary }`
const GET_STOCK = gql`query GetStockItems($input: PaginationInput) { getStockItems(input: $input) }`

type InventoryTab = 'summary' | 'items' | 'movements'

export default function Inventory() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as InventoryTab) || 'summary'
  const { data: sumData, loading: sumLoading } = useQuery(GET_SUMMARY)
  const { data: stockData, loading: stockLoading } = useQuery(GET_STOCK, { variables: { input: { take: 50 } } })
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

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
      <PageHeader title='库存盘点' desc="库存水位 · 一品一码 · 全链路流水" />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList className="mb-6">
          <TabsTrigger value="summary">'库存汇总'</TabsTrigger>
          <TabsTrigger value="items">'库存单元'</TabsTrigger>
          <TabsTrigger value="movements">'库存流水'</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <DataTable loading={sumLoading} columns={[
            { key: 'name', title: '物资', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'code', title: '编码', render: (r) => (r.material as { code?: string })?.code ?? '—' },
            { key: 'quantity', title: '在库数量' },
            { key: 'stockStatus', title: '水位', render: (r) => stockBadge(String(r.stockStatus)) },
            { key: 'expiryLevel', title: '效期', render: (r) => {
              const lv = ALERT_LEVEL[String(r.expiryLevel)] ?? { label: '—', color: 'bg-muted' }
              return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${lv.color}`} />{lv.label}</span>
            }},
            { key: 'batchCount', title: '批次数' },
          ]} rows={summary} />
        </TabsContent>

        <TabsContent value="items">
          <DataTable loading={stockLoading} columns={[
            { key: 'qrCode', title: '二维码', render: (r) => (
              <span className="font-mono text-xs">{String(r.qrCode)}</span>
            )},
            { key: 'material', title: '物资', render: (r) => (r.material as { name?: string })?.name ?? '—' },
            { key: 'quantity', title: '数量' },
            { key: 'status', title: '状态', render: (r) => <Badge variant="secondary">{STATUS_LABELS[String(r.status)]}</Badge> },
            { key: 'shelf', title: '货位', render: (r) => (r.shelf as { code?: string })?.code ?? '未上架' },
            { key: 'batch', title: '批次', render: (r) => (r.batch as { batchNo?: string })?.batchNo ?? '—' },
            { key: 'action', title: '操作', render: (r) => (
              <QrPrintButton label={stockItemToLabel(r)} onOpen={openLabel} />
            )},
          ]} rows={items} />
        </TabsContent>

        <TabsContent value="movements" id="movements">
          <MovementsSection />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} />
    </div>
  )
}

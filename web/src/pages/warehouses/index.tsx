import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { LayoutGrid, Warehouse as WarehouseIcon } from 'lucide-react'
import { PageHeader, DataTable, Badge, RowActions, CardContent, CardHeader, CardTitle, PageCreateButton } from 'components/common'
import { LeaderSurfaceCard } from 'components/leader-surface-card'
import { QrLabelDialog, QrPrintButton } from 'components/qr-label-dialog'
import { shelfToLabel, type QrLabelData } from 'components/qr-label'
import { SectionMenu } from 'components/section-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { Tabs, TabsContent } from 'components/ui/tabs'
import { ZONE_LABELS } from 'lib/utils'
import { GET_WAREHOUSES, GET_SHELVES, DEL_WAREHOUSE, DEL_SHELF, type WarehouseTab } from './queries'

const WAREHOUSE_MENU = [
  { value: 'warehouse' as const, label: '仓库', icon: WarehouseIcon },
  { value: 'shelf' as const, label: '货位', icon: LayoutGrid },
]

export default function WarehousesIndex() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as WarehouseTab) || 'warehouse'
  const [filterWh, setFilterWh] = useState('all')
  const [labelOpen, setLabelOpen] = useState(false)
  const [labelData, setLabelData] = useState<QrLabelData | null>(null)

  const openLabel = (label: QrLabelData) => {
    setLabelData(label)
    setLabelOpen(true)
  }

  const refetchOpts = { refetchQueries: ['GetWarehouses', 'GetShelves'] }
  const { data: whData, loading: whLoading } = useQuery(GET_WAREHOUSES)
  const { data: shData, loading: shLoading } = useQuery(GET_SHELVES, {
    variables: { warehouseId: filterWh === 'all' ? undefined : filterWh, input: { take: 200 } },
  })
  const [delWarehouse] = useMutation(DEL_WAREHOUSE, refetchOpts)
  const [delShelf] = useMutation(DEL_SHELF, refetchOpts)

  const warehouses = (whData?.getWarehouses as { warehouses: Array<Record<string, unknown>> })?.warehouses ?? []
  const shelves = (shData?.getShelves as { shelves: Array<Record<string, unknown>> })?.shelves ?? []

  const handleDelete = async (type: WarehouseTab, id: string) => {
    if (!confirm('确认删除？')) return
    try {
      type === 'warehouse' ? await delWarehouse({ variables: { input: { id } } }) : await delShelf({ variables: { input: { id } } })
    } catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  const createPath = tab === 'warehouse'
    ? '/warehouses/warehouse/create'
    : `/warehouses/shelf/create${filterWh !== 'all' ? `?warehouseId=${filterWh}` : ''}`

  return (
    <div>
      <PageHeader
        title="仓库货位维护"
        titleTip="中心主库 + 战略备库 · A/B/C/D 四区分区 · 货位二维码"
      />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <SectionMenu
          className="mb-4"
          items={WAREHOUSE_MENU}
          value={tab}
          onChange={(v) => setParams({ tab: v })}
          toolbar={{
            search: tab === 'shelf' ? (
              <Select value={filterWh} onValueChange={setFilterWh}>
                <SelectTrigger className="w-full"><SelectValue placeholder="全部仓库" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部仓库</SelectItem>
                  {warehouses.map((w) => <SelectItem key={String(w.id)} value={String(w.id)}>{String(w.name)}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : undefined,
            action: (
              <PageCreateButton
                label={tab === 'warehouse' ? '新增仓库' : '新增货位'}
                onClick={() => navigate(createPath)}
              />
            ),
          }}
        />

        <TabsContent value="warehouse" className="mt-0">
          <div className="leader-workspace-grid grid grid-cols-1 sm:grid-cols-2">
            {warehouses.map((wh) => (
              <LeaderSurfaceCard key={String(wh.id)} interactive className="group relative">
                <CardHeader className="pb-2">
                  <Badge variant="info">{ZONE_LABELS[String(wh.zone)]}</Badge>
                  <CardTitle className="text-base">{String(wh.name)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{String(wh.code)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{String(wh.area ?? '—')} m² · 容量 {String(wh.capacity ?? '—')}</p>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100">
                    <RowActions onEdit={() => navigate(`/warehouses/warehouse/${wh.id}/edit`)} onDelete={() => handleDelete('warehouse', String(wh.id))} />
                  </div>
                </CardContent>
              </LeaderSurfaceCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shelf" className="mt-0">
          <DataTable loading={whLoading || shLoading} columns={[
            { key: 'code', title: '货位编码', tip: '货位唯一编码，扫码上架时使用' },
            { key: 'name', title: '名称', tip: '货位显示名称' },
            { key: 'zone', title: '分区', tip: '库内 A/B/C/D 存储分区' },
            { key: 'level', title: '层', tip: '货架层数' },
            { key: 'qrCode', title: '货架码', tip: '货位二维码，贴于货架便于扫码' },
            { key: 'warehouse', title: '所属仓库', tip: '货位归属的物理库房', render: (r) => (r.warehouse as { name?: string })?.name ?? '—' },
            { key: 'count', title: '库存单元', tip: '当前存放的物资二维码数量', render: (r) => String((r._count as { stockItems?: number })?.stockItems ?? 0) },
            { key: 'action', title: '操作', render: (r) => (
              <div className="flex items-center gap-1">
                <QrPrintButton label={shelfToLabel(r)} onOpen={openLabel} />
                <RowActions onEdit={() => navigate(`/warehouses/shelf/${r.id}/edit`)} onDelete={() => handleDelete('shelf', String(r.id))} />
              </div>
            ) },
          ]} rows={shelves} />
        </TabsContent>
      </Tabs>

      <QrLabelDialog open={labelOpen} onOpenChange={setLabelOpen} label={labelData} description="货位标签，贴于货架便于上架扫码" />
    </div>
  )
}
